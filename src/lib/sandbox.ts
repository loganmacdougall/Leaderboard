// Runs template-authored JS in an isolated realm — no allow-same-origin, so the outer
// iframe gets a unique opaque origin, and the *actual* template code runs in a Worker
// spawned from inside that iframe (inheriting its opaque origin) rather than in the
// iframe's own document. Two independent guarantees, both load-bearing:
//
//  - Origin isolation (from the iframe): the sandbox cannot read this page's cookies,
//    localStorage, or DOM, and cannot make authenticated same-origin requests. This is
//    what makes running arbitrary template JS safe — not any attempt to restrict what
//    the JS can *say*, but the fact that the realm it runs in has nothing dangerous to
//    reach for.
//  - Thread isolation (from the Worker): confirmed by testing that a plain
//    sandboxed <iframe> does NOT reliably get its own OS thread/process for `srcdoc`
//    content — a `while(true){}` inside one hung the entire tab, including this
//    module's own parent-side setTimeout-based call timeout, since a synchronous busy
//    loop blocks every same-thread timer. A Worker's own thread is a spec guarantee,
//    not a heuristic, and `worker.terminate()` is a real, always-available kill switch.
//    A worker spawned from the sandboxed iframe inherits its opaque origin, so this adds
//    thread isolation without losing origin isolation.
//
// The only channel in or out of either boundary is postMessage, carrying only the
// specific structured messages defined below. Browser-only module (iframe/Worker/
// postMessage) — never imported server-side.

export type SandboxCell = {
  id: number;
  n1: number; n2: number; n3: number | null; n4: number | null;
  n5: number | null; n6: number | null; n7: number | null; n8: number | null;
  s: string;
};

export type SandboxRow = { id: number; cells: SandboxCell[] };

export type ButtonSnapshot = {
  rows: SandboxRow[];
  columnCount: number;
  focusRow: number;
  focusCol: number;
};

export type ButtonResult = {
  rows: SandboxRow[];
  requestedFocus: { row: number; col: number } | null;
  requestedKeyboard: string | null;
};

export type DisplayPlayer = {
  name: string;
  score: number; // sum of computeScore() over rounds before the focused round
  plus: number;  // sum of computeScore() over the focused round and any after it
  rank: number;  // 1-indexed position after sorting by score descending
  cells: SandboxCell[]; // this player's raw per-round cells, in round order
  // This player's cell in the currently-focused round, or null if no round is focused.
  // Deliberately not a boolean "locked" field — what counts as "locked" (or anything
  // else about the active round) is entirely template-defined, not something core app
  // code can compute without hardcoding a specific game's flag conventions.
  focusCell: SandboxCell | null;
};

const CALL_TIMEOUT_MS = 1000;

// My own trusted code, run inside the Worker (opaque origin, dedicated thread). Defines
// the curated `ctx` API against whatever state the parent sends, and dispatches incoming
// calls. NOT template-authored — this is what makes the template's functions callable.
function workerBootstrapSource(): string {
  return `
(function () {
  function makeCtx(snapshot) {
    var state = snapshot;
    var requestedFocus = null;
    var requestedKeyboard = null;

    function getCell(row, col) {
      var r = state.rows[row];
      if (!r) return null;
      return r.cells[col] ?? null;
    }

    function toggleFlag(cell, ch) {
      if (!cell) return;
      cell.s = cell.s.indexOf(ch) === -1 ? cell.s + ch : cell.s.split(ch).join('');
    }

    function setFlag(cell, ch, value) {
      if (!cell) return;
      var has = cell.s.indexOf(ch) !== -1;
      if (value && !has) cell.s += ch;
      if (!value && has) cell.s = cell.s.split(ch).join('');
    }

    function changeFocus(row, col) { requestedFocus = { row: row, col: col }; }
    function switchKeyboard(name) { requestedKeyboard = name; }

    var ctx = {
      getCell: getCell,
      toggleFlag: toggleFlag,
      setFlag: setFlag,
      changeFocus: changeFocus,
      switchKeyboard: switchKeyboard,
      rows: state.rows,
      rowCount: state.rows.length,
      columnCount: state.columnCount,
      focusRow: state.focusRow,
      focusCol: state.focusCol
    };
    Object.defineProperty(ctx, 'cell', {
      get: function () { return getCell(state.focusRow, state.focusCol); }
    });

    return {
      ctx: ctx,
      getResult: function () {
        return { rows: state.rows, requestedFocus: requestedFocus, requestedKeyboard: requestedKeyboard };
      }
    };
  }

  self.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || typeof msg.requestId !== 'number') return;

    function reply(ok, payload) {
      self.postMessage({ requestId: msg.requestId, ok: ok, result: ok ? payload : undefined, error: ok ? undefined : String(payload) });
    }

    try {
      if (msg.kind === 'button') {
        var fn = self[msg.handlerName];
        if (typeof fn !== 'function') throw new Error('No handler named ' + msg.handlerName);
        var built = makeCtx(msg.snapshot);
        fn(built.ctx);
        reply(true, built.getResult());
      } else if (msg.kind === 'score') {
        if (typeof self.computeScore !== 'function') throw new Error('Template has no computeScore function');
        reply(true, self.computeScore(msg.cell));
      } else if (msg.kind === 'cellLabel') {
        if (typeof self.getCellLabel !== 'function') throw new Error('Template has no getCellLabel function');
        reply(true, self.getCellLabel(msg.cell));
      } else if (msg.kind === 'sortDirection') {
        // Not every game has the highest score winning (Uno, golf strokes, etc.) — this
        // is optional, defaulting to descending (highest first) if a template doesn't
        // define it, so existing templates like Flip7 don't need to change.
        var dir = typeof self.getSortDirection === 'function' ? self.getSortDirection() : 'desc';
        reply(true, dir === 'asc');
      } else if (msg.kind === 'display') {
        var displayFn = self[msg.fn];
        if (typeof displayFn !== 'function') throw new Error('Template has no ' + msg.fn + ' function');
        reply(true, displayFn(msg.player));
      } else if (msg.kind === 'plusZeroColor') {
        // Optional, like getSortDirection — most templates have no reason for a "+0"
        // to mean anything different from "nothing to show yet", so this defaults to
        // null (keep hiding it) rather than requiring every template to define it.
        var plusColor = typeof self.getPlusZeroColor === 'function' ? self.getPlusZeroColor(msg.player) : null;
        reply(true, plusColor);
      } else {
        throw new Error('Unknown message kind: ' + msg.kind);
      }
    } catch (e) {
      reply(false, e && e.message ? e.message : String(e));
    }
  });

  self.postMessage({ ready: true });
})();
`;
}

// The iframe's own bootstrap: a pure relay between the parent and the Worker it spawns.
// Its only jobs are (a) establish the opaque origin, (b) spawn/terminate the Worker the
// template code actually runs in, (c) forward messages both directions unmodified.
const IFRAME_RELAY_SOURCE = `
(function () {
  var worker = null;

  function spawnWorker(workerSource) {
    var blob = new Blob([workerSource], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    worker.addEventListener('message', function (event) {
      parent.postMessage(event.data, '*');
    });
    worker.addEventListener('error', function (event) {
      parent.postMessage({ ready: false, workerError: String(event.message || event) }, '*');
    });
  }

  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg) return;

    if (msg.kind === 'init') {
      spawnWorker(msg.workerSource);
      return;
    }
    if (msg.kind === 'terminate') {
      if (worker) worker.terminate();
      spawnWorker(msg.workerSource);
      return;
    }
    if (worker) worker.postMessage(msg);
  });

  parent.postMessage({ relayReady: true }, '*');
})();
`;

function escapeScriptClose(src: string): string {
  // Prevents a literal "</script" inside embedded source from prematurely closing the
  // <script> tag it's placed in — an HTML-parsing correctness issue, not a sandbox
  // escape (the iframe/worker are isolated regardless of how its own markup parses).
  return src.replace(/<\/script/gi, '<\\/script');
}

function buildSrcdoc(): string {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>` +
    `<script>${IFRAME_RELAY_SOURCE}<\/script>` +
    `</body></html>`;
}

function buildWorkerSource(templateScript: string): string {
  return `${escapeScriptClose(templateScript)}\n${workerBootstrapSource()}`;
}

type PendingCall = {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export type Sandbox = {
  iframe: HTMLIFrameElement;
  workerSource: string;
  pending: Map<number, PendingCall>;
  nextRequestId: number;
  ready: Promise<void>;
};

export function createSandbox(script: string): Sandbox {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';

  const workerSource = buildWorkerSource(script);

  const sandbox: Sandbox = {
    iframe,
    workerSource,
    pending: new Map(),
    nextRequestId: 1,
    ready: undefined as unknown as Promise<void>
  };

  sandbox.ready = new Promise((resolve, reject) => {
    let relayReady = false;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const msg = event.data;

      if (msg && msg.relayReady) {
        relayReady = true;
        iframe.contentWindow?.postMessage({ kind: 'init', workerSource }, '*');
        return;
      }
      if (msg && msg.ready) {
        resolve();
        return;
      }
      if (msg && msg.ready === false) {
        reject(new Error(msg.workerError || 'Sandbox worker failed to start'));
        return;
      }

      if (!relayReady || !msg || typeof msg.requestId !== 'number') return;
      const entry = sandbox.pending.get(msg.requestId);
      if (!entry) return;

      clearTimeout(entry.timeout);
      sandbox.pending.delete(msg.requestId);
      if (msg.ok) entry.resolve(msg.result);
      else entry.reject(new Error(msg.error));
    };
    window.addEventListener('message', onMessage);
  });

  iframe.srcdoc = buildSrcdoc();
  document.body.appendChild(iframe);

  return sandbox;
}

function failAllPending(sandbox: Sandbox, reason: string) {
  for (const { reject, timeout } of sandbox.pending.values()) {
    clearTimeout(timeout);
    reject(new Error(reason));
  }
  sandbox.pending.clear();
}

async function call(sandbox: Sandbox, message: Record<string, unknown>): Promise<any> {
  await sandbox.ready;

  return new Promise((resolve, reject) => {
    const requestId = sandbox.nextRequestId++;
    const timeout = setTimeout(() => {
      sandbox.pending.delete(requestId);
      // The worker hung (e.g. an infinite loop) — kill it and respawn a fresh one so
      // later calls on this same sandbox aren't stuck behind a dead worker forever.
      sandbox.iframe.contentWindow?.postMessage({ kind: 'terminate', workerSource: sandbox.workerSource }, '*');
      reject(new Error('Sandbox call timed out'));
    }, CALL_TIMEOUT_MS);

    sandbox.pending.set(requestId, { resolve, reject, timeout });
    sandbox.iframe.contentWindow?.postMessage({ ...message, requestId }, '*');
  });
}

export function runButtonHandler(sandbox: Sandbox, handlerName: string, snapshot: ButtonSnapshot): Promise<ButtonResult> {
  return call(sandbox, { kind: 'button', handlerName, snapshot });
}

export function runScoreFunction(sandbox: Sandbox, cell: SandboxCell): Promise<number> {
  return call(sandbox, { kind: 'score', cell });
}

// A cell's display in the editor grid is entirely template-defined (e.g. showing a lock
// emoji, an x2 marker, or a bonus amount in parens) — core app code has no idea what any
// of a cell's flags mean, so it can't format this itself.
export function runCellLabelFunction(sandbox: Sandbox, cell: SandboxCell): Promise<string> {
  return call(sandbox, { kind: 'cellLabel', cell });
}

// Whether the leaderboard should sort ascending (lowest score wins — Uno, golf strokes)
// instead of the default descending. Called once per page load, not per player.
export function runSortDirection(sandbox: Sandbox): Promise<boolean> {
  return call(sandbox, { kind: 'sortDirection' });
}

export function runDisplayFunction(sandbox: Sandbox, fn: 'getColor' | 'getText', player: DisplayPlayer): Promise<string> {
  return call(sandbox, { kind: 'display', fn, player });
}

// Optional per-template hook: when a player's "+N" this-round indicator is exactly 0,
// should it still be shown (e.g. to flag a locked-in bust), and in what color? Returns
// null/undefined to keep the default (hide it), same convention as getSortDirection.
export function runPlusZeroColor(sandbox: Sandbox, player: DisplayPlayer): Promise<string | null> {
  return call(sandbox, { kind: 'plusZeroColor', player });
}

export function destroySandbox(sandbox: Sandbox): void {
  sandbox.iframe.remove();
  failAllPending(sandbox, 'Sandbox destroyed');
}
