<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import LeaderboardKeyboard, { type KeyboardButtonSpec } from './LeaderboardKeyboard.svelte';
  import { createSandbox, destroySandbox, runButtonHandler, runCellLabelFunction, type Sandbox, type ButtonSnapshot } from '$lib/sandbox';

  type Cell = {
    id: number; display_order: number;
    n1: number; n2: number; n3: number | null; n4: number | null;
    n5: number | null; n6: number | null; n7: number | null; n8: number | null;
    s: string; leaderboard_row_id: number;
  };
  type Row = { id: number; display_order: number; cells: Cell[] };
  type Header = { id: number; display_order: number; s: string };

  const NUMERIC_FIELDS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'] as const;

  let { data } = $props();
  const edit_id: string = data.edit_id;
  const keyboards = data.template.keyboards;

  let name = $state(data.initial_lb.metadata.name as string);
  let headers: Header[] = $state(data.initial_lb.headers);
  let rows: Row[] = $state(data.initial_lb.rows);

  let focusRow = $state(data.initial_lb.metadata.focus_row_id === null
    ? -1
    : rows.findIndex((r: Row) => r.id === data.initial_lb.metadata.focus_row_id));
  let focusCol = $state(data.initial_lb.metadata.focus_header_id === null
    ? -1
    : headers.findIndex((h: Header) => h.id === data.initial_lb.metadata.focus_header_id));

  let activeKeyboardId: number | null = $state(keyboards.find((k) => k.starts)?.id ?? keyboards[0]?.id ?? null);
  const activeKeyboard = $derived(keyboards.find((k) => k.id === activeKeyboardId));

  const focusedCell = $derived(
    (focusRow !== -1 && focusCol !== -1) ? rows[focusRow]?.cells[focusCol] : undefined
  );

  // The template controls what a cell's raw n1..n8/s even mean (locking, x2, whatever a
  // future template invents), so the core editor can't format a cell's display itself —
  // it asks the sandbox, same as the view page does for scoring/color/text.
  let sandbox: Sandbox | null = null;
  let cellLabels: Record<number, string> = $state({});

  async function refreshLabel(cell: Cell) {
    if (!sandbox) return;
    try {
      // Cells here are Svelte $state proxies — postMessage needs a plain, structured-
      // cloneable copy, not a live reactive reference.
      const label = await runCellLabelFunction(sandbox, { ...cell });
      cellLabels = { ...cellLabels, [cell.id]: label };
    } catch (e) {
      console.error('getCellLabel failed:', e);
    }
  }

  function cellLabel(cell: Cell | undefined) {
    if (!cell) return '';
    return cellLabels[cell.id] ?? '…';
  }

  onMount(() => {
    sandbox = createSandbox(data.template.template.script);
    for (const row of rows) for (const cell of row.cells) refreshLabel(cell);
  });

  onDestroy(() => {
    if (sandbox) destroySandbox(sandbox);
  });

  async function saveName() {
    await fetch(`/api/leaderboard/${edit_id}/update_name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async function setFocus(newRow: number, newCol: number) {
    focusRow = newRow;
    focusCol = newCol;
    const focus_row_id = newRow === -1 ? null : rows[newRow]?.id ?? null;
    const focus_header_id = newCol === -1 ? null : headers[newCol]?.id ?? null;
    await fetch(`/api/leaderboard/${edit_id}/focus`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus_row_id, focus_header_id })
    });
  }

  async function selectCell(r: number, c: number) {
    if (focusRow === r && focusCol === c) {
      await setFocus(-1, -1);
      return;
    }
    await setFocus(r, c);
  }

  let tableContainerEl: HTMLElement | undefined = $state();

  // A trackpad/mouse wheel only produces vertical delta by default, and the page itself
  // has nothing to scroll vertically past the table, so without this a desktop user has
  // no way to reach columns off to the side short of Shift+scroll or dragging a thin
  // scrollbar. Redirect vertical wheel input into horizontal scroll while the pointer is
  // over the table and there's actually overflow to scroll.
  function handleTableWheel(e: WheelEvent) {
    if (!tableContainerEl) return;
    if (tableContainerEl.scrollWidth <= tableContainerEl.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    tableContainerEl.scrollLeft += e.deltaY;
    e.preventDefault();
  }

  // Runs whenever focus moves — from a tap as well as from keyboard-driven nav (arrow
  // buttons can move focus off-screen, e.g. many rounds/players away). scrollIntoView
  // handles the horizontal case (.table-container is the nearest x-scrollable ancestor)
  // and vertical cases where the cell is above/below the viewport entirely, but it has
  // no idea the on-screen keyboard is a fixed panel covering the bottom half of the
  // viewport, so a cell it considers "visible" can still be physically hidden under it —
  // hence the extra nudge below.
  $effect(() => {
    const row = focusRow;
    const col = focusCol;
    if (row === -1 || col === -1 || !tableContainerEl) return;
    const cellEl = tableContainerEl.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);
    if (!cellEl) return;

    cellEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    requestAnimationFrame(() => {
      const rect = cellEl.getBoundingClientRect();
      const keyboardTop = window.innerHeight * 0.5;
      if (rect.bottom > keyboardTop) {
        window.scrollBy({ top: rect.bottom - keyboardTop + 16, behavior: 'smooth' });
      }
    });
  });

  async function patchCell(cell: Cell, patch: Record<string, number | string>) {
    Object.assign(cell, patch);
    await fetch(`/api/leaderboard/${edit_id}/cell/${cell.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  async function addRow() {
    const res = await fetch(`/api/leaderboard/${edit_id}/row`, { method: 'POST' });
    if (!res.ok) return null;
    const { row } = await res.json();
    rows.push(row);
    for (const cell of row.cells as Cell[]) refreshLabel(cell);
    return row;
  }

  async function onButtonPress(button: KeyboardButtonSpec) {
    if (!sandbox) return;

    const snapshot: ButtonSnapshot = {
      rows: rows.map((r) => ({ id: r.id, cells: r.cells.map((c) => ({ ...c })) })),
      columnCount: headers.length,
      focusRow,
      focusCol
    };

    let result;
    try {
      result = await runButtonHandler(sandbox, button.handler_name, snapshot);
    } catch (e) {
      console.error(`Button "${button.name}" failed:`, e);
      return;
    }

    const changedCells: Cell[] = [];
    for (const resultRow of result.rows) {
      const localRow = rows.find((r) => r.id === resultRow.id);
      if (!localRow) continue;

      for (const resultCell of resultRow.cells) {
        const localCell = localRow.cells.find((c) => c.id === resultCell.id);
        if (!localCell) continue;

        const patch: Record<string, number | string> = {};
        for (const field of NUMERIC_FIELDS) {
          if (localCell[field] !== resultCell[field]) patch[field] = resultCell[field] as number;
        }
        if (localCell.s !== resultCell.s) patch.s = resultCell.s;

        if (Object.keys(patch).length > 0) {
          await patchCell(localCell, patch);
          changedCells.push(localCell);
        }
      }
    }
    for (const cell of changedCells) refreshLabel(cell);

    if (result.requestedKeyboard) {
      const kb = keyboards.find((k) => k.name === result.requestedKeyboard);
      if (kb) activeKeyboardId = kb.id;
    }

    if (result.requestedFocus) {
      while (result.requestedFocus.row >= rows.length) {
        const newRow = await addRow();
        if (!newRow) break;
      }
      await setFocus(result.requestedFocus.row, result.requestedFocus.col);
    }
  }

  // A fast double-click/double-tap fires two click events before the first request's
  // response comes back, which without a guard sends two POSTs and adds two players.
  let addingHeader = $state(false);

  const addHeader = async () => {
    if (addingHeader) return;
    addingHeader = true;
    try {
      const res = await fetch(`/api/leaderboard/${edit_id}/header`, { method: 'POST' });
      if (!res.ok) return;
      const { header, cells } = await res.json();
      headers.push(header);
      for (const cell of cells as Cell[]) {
        const row = rows.find((r) => r.id === cell.leaderboard_row_id);
        if (row) row.cells.push(cell);
      }
      for (const cell of cells as Cell[]) refreshLabel(cell);
    } finally {
      addingHeader = false;
    }
  };

  const removeHeaderAt = async (i: number) => {
    const header = headers[i];
    const res = await fetch(`/api/leaderboard/${edit_id}/header/${header.id}`, { method: 'DELETE' });
    if (!res.ok) return;

    headers.splice(i, 1);
    for (const row of rows) row.cells.splice(i, 1);

    if (focusCol === i) focusCol = -1;
    else if (focusCol > i) focusCol -= 1;
  };

  const renameHeader = async (i: number) => {
    const header = headers[i];
    await fetch(`/api/leaderboard/${edit_id}/header/${header.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: header.s })
    });
  };

  const removeRowAt = async (i: number) => {
    const row = rows[i];
    const res = await fetch(`/api/leaderboard/${edit_id}/row/${row.id}`, { method: 'DELETE' });
    if (!res.ok) return;

    rows.splice(i, 1);
    if (focusRow === i) { focusRow = -1; focusCol = -1; }
    else if (focusRow > i) focusRow -= 1;
  };
</script>

<div class="edit-page">
  <div class="share-banner">
    <span class="share-label">Share this code to view live</span>
    <span class="share-code">{data.view_id}</span>
  </div>

  <input
    id="leaderboard_name"
    class="title-input"
    type="text"
    bind:value={name}
    oninput={saveName}
    placeholder="Leaderboard name"
  >

  <div class="table-container" bind:this={tableContainerEl} onwheel={handleTableWheel}>
    <table>
      <thead>
        <tr>
          <th class="corner">
            <button class="icon-button add" onclick={addHeader} disabled={addingHeader} title="Add player">+</button>
          </th>
          {#each headers as _, i}
            <th><button class="icon-button remove" onclick={() => { removeHeaderAt(i) }} title="Remove player">×</button></th>
          {/each}
        </tr>
      </thead>
      <thead>
        <tr>
          <th class="corner">Round</th>
          {#each headers as header, i}
            <th><input class="player-name-input" size="1" bind:value={headers[i].s} oninput={() => renameHeader(i)} placeholder="Player {i + 1}" /></th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, rowIndex}
          <tr>
            <td class="row-head">
              <button class="icon-button remove small" onclick={() => { removeRowAt(rowIndex) }} title="Remove round">×</button>
              {rowIndex + 1}
            </td>
            {#each headers as _, colIndex}
              {@const cell = row.cells[colIndex]}
              <td
                class={rowIndex === focusRow && colIndex === focusCol ? 'cell focused' : 'cell'}
                data-row={rowIndex}
                data-col={colIndex}
                onclick={() => { selectCell(rowIndex, colIndex) }}
              >
                {cell ? cellLabel(cell) : ''}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if activeKeyboard}
  <LeaderboardKeyboard
    buttons={activeKeyboard.buttons}
    columns={activeKeyboard.columns}
    rows={activeKeyboard.rows}
    onPress={onButtonPress}
    label={focusedCell ? `${headers[focusCol]?.s}: ${cellLabel(focusedCell)}` : "Tap a cell to begin"}
  />
{/if}

<style>
  .edit-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 1rem 0;
  }

  .share-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    background-color: var(--surface-alt);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .share-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .share-code {
    font-weight: 800;
    letter-spacing: 0.2em;
    color: var(--accent);
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  .title-input {
    display: block;
    width: 100%;
    border: 1.5px solid transparent;
    background: none;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    padding: 0.4rem 0.6rem;
    margin-bottom: 1.25rem;
    border-radius: var(--radius-sm);
  }

  .title-input:hover {
    border-color: var(--border-color);
  }

  .title-input:focus-visible {
    border-color: var(--accent);
    background-color: var(--surface);
  }

  .table-container {
    /* Matches the title input / share banner's width as a floor — a table with only a
       couple of columns still shouldn't look like a tiny orphaned box on an otherwise
       full-width page. The <table> inside keeps width:max-content (no min-width of its
       own), so a small table just sits left-aligned with blank space to its right
       rather than having its columns stretched to fill this width. Once the table's
       natural content needs more room than this, it grows the container up to 100% of
       .edit-page and overflow-x scrolls the rest — same as before. */
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 55vh;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  table {
    box-sizing: border-box;
    /* width:max-content makes the table size itself to its content's natural width —
       respecting each cell's min-width — instead of a percentage that some mobile
       browsers resolve against the container and then clip/squish rather than overflow.
       .table-container's overflow-x scrolls once the table exceeds it. */
    width: max-content;
    border-collapse: collapse;
    background-color: var(--surface);
  }

  .player-name-input {
    width: 100%;
    /* Text inputs have a browser-default intrinsic minimum width that's wider than our
       column min-width — without zeroing it, the input (not our CSS) ends up dictating
       how narrow a column can get. */
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
    border: none;
    background: none;
    text-align: center;
    font-weight: 700;
    color: var(--text-primary);
    border-radius: 0;
  }

  .icon-button {
    width: 1.75rem;
    height: 1.75rem;
    min-width: 0;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 700;
    line-height: 1;
    border: 1px solid var(--border-color);
    background-color: var(--surface);
    color: var(--text-secondary);
  }

  .icon-button.small {
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.75rem;
    margin-right: 0.35rem;
  }

  .icon-button.add {
    color: var(--accent);
    border-color: var(--accent);
  }

  .icon-button.add:hover {
    background-color: var(--accent);
    color: var(--text-on-accent);
  }

  .icon-button.remove:hover {
    background-color: var(--color-red);
    border-color: var(--color-red);
    color: var(--text-on-accent);
  }

  th, td {
    height: 2.75rem;
    min-width: 5.25rem;
    padding: 0 0.4rem;
    border: 1px solid var(--border-color);
    text-align: center;
    font-size: 0.95rem;
  }

  th.corner, .row-head {
    min-width: 2.5rem;
  }

  th.corner {
    background-color: var(--surface-alt);
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 0.85rem;
  }

  thead th {
    background-color: var(--surface-alt);
  }

  .row-head {
    background-color: var(--surface-alt);
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 0.85rem;
  }

  .cell {
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .cell:hover {
    background-color: var(--surface-alt);
  }

  .focused {
    background-color: rgba(79, 70, 229, 0.08);
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  @media only screen and (max-width: 600px) {
    /* Slightly wider than the desktop floor — on a phone, a cramped column is worse
       than needing one extra swipe to scroll to the next player. */
    th, td {
      min-width: 6.5rem;
    }
  }
</style>
