<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { createSandbox, destroySandbox, runScoreFunction, runDisplayFunction, runSortDirection, runPlusZeroColor, type Sandbox } from '$lib/sandbox';

  type Cell = {
    id: number; display_order: number;
    n1: number; n2: number; n3: number | null; n4: number | null;
    n5: number | null; n6: number | null; n7: number | null; n8: number | null;
    s: string; leaderboard_row_id: number;
  };
  type Row = { id: number; display_order: number; cells: Cell[] };
  type Header = { id: number; display_order: number; s: string };

  let { data } = $props();
  const { id } = $derived(data);

  let lb: { metadata?: { name?: string; focus_row_id?: number | null; focus_header_id?: number | null }; headers?: Header[]; rows?: Row[] } = $state(data.initial_lb);

  let name = $derived(lb.metadata?.name || 'Leaderboard');
  let headers: Header[] = $derived(lb.headers || []);
  let rows: Row[] = $derived(lb.rows || []);
  let focusRowIndex = $derived(rows.findIndex((r) => r.id === lb.metadata?.focus_row_id));
  let focusHeaderId = $derived(lb.metadata?.focus_header_id ?? null);

  let sandbox: Sandbox | null = null;
  let cellScores: Record<number, number> = $state({});
  let playerColors: Record<number, string> = $state({});
  let playerTexts: Record<number, string> = $state({});
  let plusZeroColors: Record<number, string | null> = $state({});
  let sortAscending = $state(false);
  let connected = $state(true);

  const DEFAULT_COLOR = 'var(--color-green)';
  const COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$|^var\(--color-[a-z]+\)$/;

  function sanitizeColor(color: unknown): string {
    return typeof color === 'string' && COLOR_PATTERN.test(color) ? color : DEFAULT_COLOR;
  }

  // Unlike sanitizeColor above, an invalid/absent value here means "keep hiding +0",
  // not "fall back to a default color" — there is no sensible default for this one.
  function sanitizePlusZeroColor(color: unknown): string | null {
    return typeof color === 'string' && COLOR_PATTERN.test(color) ? color : null;
  }

  async function refreshCellScore(cell: Cell) {
    if (!sandbox) return;
    try {
      // Cell is a Svelte $state proxy — postMessage needs a plain, structured-cloneable
      // copy, not a live reactive reference.
      const score = await runScoreFunction(sandbox, { ...cell });
      cellScores = { ...cellScores, [cell.id]: score };
    } catch (e) {
      console.error('computeScore failed:', e);
    }
  }

  function refreshAllScores() {
    for (const row of rows) for (const cell of row.cells) refreshCellScore(cell);
  }

  let players = $derived.by(() => {
    if (headers.length === 0) return [];

    const list = headers.map((h, c) => {
      let score = 0;
      let plus = 0;
      const cells: Cell[] = [];
      let focusCell: Cell | null = null;

      rows.forEach((row, r) => {
        const cell = row.cells[c];
        if (!cell) return;
        cells.push(cell);

        const cellScore = cellScores[cell.id] ?? 0;
        if (focusRowIndex === -1 || r < focusRowIndex) score += cellScore;
        else plus += cellScore;

        if (r === focusRowIndex) focusCell = cell;
      });

      return { id: h.id, name: h.s, score, plus, cells, focusCell };
    });

    const sorted = list.sort((a, b) => sortAscending ? a.score - b.score : b.score - a.score);
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  });

  async function refreshDisplay(player: (typeof players)[number]) {
    if (!sandbox) return;
    const { id: headerId, ...rest } = player;
    // cells/focusCell hold Svelte $state proxy references — postMessage needs plain,
    // structured-cloneable copies.
    const displayPlayer = {
      ...rest,
      cells: rest.cells.map((c) => ({ ...c })),
      focusCell: rest.focusCell === null ? null : Object.assign({}, rest.focusCell)
    };
    try {
      const [color, text, plusZeroColor] = await Promise.all([
        runDisplayFunction(sandbox, 'getColor', displayPlayer),
        runDisplayFunction(sandbox, 'getText', displayPlayer),
        runPlusZeroColor(sandbox, displayPlayer)
      ]);
      playerColors = { ...playerColors, [headerId]: sanitizeColor(color) };
      playerTexts = { ...playerTexts, [headerId]: typeof text === 'string' ? text : '' };
      plusZeroColors = { ...plusZeroColors, [headerId]: sanitizePlusZeroColor(plusZeroColor) };
    } catch (e) {
      console.error('display function failed:', e);
    }
  }

  $effect(() => {
    for (const player of players) refreshDisplay(player);
  });

  function applyPatch(patch: any) {
    if (!lb.headers || !lb.rows) return;

    switch (patch.type) {
      case 'metadata':
        lb.metadata = patch.metadata;
        break;
      case 'header_created':
        lb.headers.push(patch.header);
        for (const cell of patch.cells as Cell[]) {
          const row = lb.rows.find((r) => r.id === cell.leaderboard_row_id);
          if (row) row.cells.push(cell);
          refreshCellScore(cell);
        }
        break;
      case 'header_updated': {
        const header = lb.headers.find((h) => h.id === patch.header.id);
        if (header) Object.assign(header, patch.header);
        break;
      }
      case 'header_deleted': {
        const i = lb.headers.findIndex((h) => h.id === patch.header_id);
        if (i !== -1) {
          lb.headers.splice(i, 1);
          for (const row of lb.rows) row.cells.splice(i, 1);
        }
        break;
      }
      case 'row_created':
        lb.rows.push(patch.row);
        for (const cell of patch.row.cells as Cell[]) refreshCellScore(cell);
        break;
      case 'row_deleted': {
        const i = lb.rows.findIndex((r) => r.id === patch.row_id);
        if (i !== -1) lb.rows.splice(i, 1);
        break;
      }
      case 'cell_updated': {
        for (const row of lb.rows) {
          const cell = row.cells.find((c) => c.id === patch.cell.id);
          if (cell) {
            Object.assign(cell, patch.cell);
            refreshCellScore(cell);
            break;
          }
        }
        break;
      }
    }
  }

  onMount(() => {
    sandbox = createSandbox(data.template.template.script);
    refreshAllScores();
    runSortDirection(sandbox).then((asc) => { sortAscending = asc; }).catch((e) => console.error('getSortDirection failed:', e));

    let eventSource: EventSource;

    function connect() {
      eventSource = new EventSource(`/api/leaderboard/stream/${id}`);

      eventSource.onopen = () => { connected = true; };

      eventSource.onmessage = (event) => {
        connected = true;
        let event_data: any;
        try {
          event_data = JSON.parse(event.data);
        } catch (e) {
          console.error('Error parsing SSE data:', e);
          return;
        }

        if (event_data.lb) {
          lb = event_data.lb;
          refreshAllScores();
        } else if (event_data.patch) {
          applyPatch(event_data.patch);
        }
      };

      eventSource.onerror = () => {
        // Deliberately not closing here — EventSource retries connecting on its own
        // after an error, but only if left alone. Calling close() (the old behavior)
        // cancelled that built-in retry entirely, which is what left the page frozen
        // until a manual refresh. Just surface that we're disconnected for now.
        connected = false;
      };
    }

    connect();

    // A backgrounded tab (or a laptop that slept) can throttle timers badly enough
    // that the browser's own reconnect loop stalls far longer than its retry interval
    // suggests. When the tab becomes active again, force a fresh connection if the old
    // one isn't actually open rather than waiting on a possibly-stuck retry.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && eventSource.readyState !== EventSource.OPEN) {
        eventSource.close();
        connect();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      eventSource.close();
    };
  });

  onDestroy(() => {
    if (sandbox) destroySandbox(sandbox);
  });

  // On the 2-column desktop layout, fill top-to-bottom then left-to-right (1,2,3 in the
  // left column, 4,5,6 in the right — like a Mario Kart results screen) instead of the
  // CSS grid default of filling row-by-row.
  let rowCount = $derived(Math.max(1, Math.ceil(players.length / 2)));
</script>

<div class="page">
  {#if !connected}
    <div class="connection-banner"><span class="reconnect-dot"></span>Reconnecting…</div>
  {/if}
  <h2>{name}</h2>
  <div class="leaderboard" style="--row-count: {rowCount};">
  {#each players as player, i (player.id)}
    <div
      class={`player-card${player.id === focusHeaderId ? " focus-player" : ""}${i === 0 ? " rank-first" : ""}`}
      style={`--player-color: ${playerColors[player.id] ?? DEFAULT_COLOR};`}
      animate:flip={{ duration: 1000, easing: quintOut }}
    >
      <span class="rank-badge">{i + 1}</span>
      <div class="player-info">
        <span class="player-name">{player.name}</span>
        {#if playerTexts[player.id]}<span class="player-tag">{playerTexts[player.id]}</span>{/if}
      </div>
      <div class="player-scores">
        <span class="player-score">{player.score}</span>
        <span
          class="player-plus"
          style={player.plus !== 0
            ? ''
            : plusZeroColors[player.id]
              ? `color: ${plusZeroColors[player.id]};`
              : 'opacity: 0;'}
        >+{player.plus}</span>
      </div>
    </div>
  {/each}
  </div>
</div>

<style>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}

.page h2 {
  text-align: center;
  margin-bottom: 1.25rem;
}

.connection-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.5rem 1rem;
  background-color: color-mix(in srgb, var(--color-yellow) 12%, var(--surface-alt));
  border: 1px solid color-mix(in srgb, var(--color-yellow) 35%, var(--border-color));
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}

.reconnect-dot {
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--color-yellow);
  animation: reconnect-pulse 1.2s ease-in-out infinite;
}

@keyframes reconnect-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background-color: color-mix(in srgb, var(--player-color) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--player-color) 30%, var(--border-color));
  border-left: 5px solid var(--player-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.focus-player {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--surface);
  border: 2px solid var(--player-color);
  color: var(--text-primary);
  font-weight: 800;
  font-size: 1rem;
}

.rank-first .rank-badge {
  background-color: var(--player-color);
  color: var(--color-white);
}

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.player-name {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-tag {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.player-scores {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  flex-shrink: 0;
}

.player-score {
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.player-plus {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--player-color);
  min-width: 2.5rem;
  text-align: right;
}

@media screen and (min-width: 1000px) {
  /* Two-column grid, filled top-to-bottom then left-to-right (rank 1..N/2 down the
     left column, the rest down the right) rather than the grid default of row-by-row. */
  .leaderboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(var(--row-count, 1), auto);
    grid-auto-flow: column;
    gap: 1rem;
  }

  .player-card {
    padding: 1.25rem 1.5rem;
  }

  .player-name {
    font-size: 1.35rem;
  }

  .player-score {
    font-size: 1.9rem;
  }
}

</style>
