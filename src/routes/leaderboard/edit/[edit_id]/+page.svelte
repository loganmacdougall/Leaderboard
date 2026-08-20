<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import HorizontalLeftSection from '$lib/components/HorizontalLeftSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';
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

  const addHeader = async () => {
    const res = await fetch(`/api/leaderboard/${edit_id}/header`, { method: 'POST' });
    if (!res.ok) return;
    const { header, cells } = await res.json();
    headers.push(header);
    for (const cell of cells as Cell[]) {
      const row = rows.find((r) => r.id === cell.leaderboard_row_id);
      if (row) row.cells.push(cell);
    }
    for (const cell of cells as Cell[]) refreshLabel(cell);
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

<HorizontalMiddleSection>
  <p>Share this code to let others view: <strong>{data.view_id}</strong></p>
</HorizontalMiddleSection>

<HorizontalLeftSection>
  <label for="leaderboard_name">Name: </label>
  <input id="leaderboard_name" type="text" bind:value={name} oninput={saveName}>
</HorizontalLeftSection>

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>
          <div style="display: flex; flex-direction: row;">
            <button class="header_button" onclick={addHeader}>+</button>
          </div>
        </th>
        {#each headers as _, i}
          <th><button class="header_button" onclick={() => { removeHeaderAt(i) }}>-</button></th>
        {/each}
      </tr>
    </thead>
    <thead>
      <tr>
        <th>Round</th>
        {#each headers as header, i}
          <th><input bind:value={headers[i].s} oninput={() => renameHeader(i)} /></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex}
        <tr>
          <td><button class="header_button" onclick={() => { removeRowAt(rowIndex) }}>-</button>{rowIndex + 1}</td>
          {#each headers as _, colIndex}
            {@const cell = row.cells[colIndex]}
            <td class={rowIndex === focusRow && colIndex === focusCol ? 'focused' : ''} onclick={() => { selectCell(rowIndex, colIndex) }}>
              {cell ? cellLabel(cell) : ''}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if activeKeyboard}
  <LeaderboardKeyboard
    buttons={activeKeyboard.buttons}
    columns={activeKeyboard.columns}
    rows={activeKeyboard.rows}
    onPress={onButtonPress}
    label={focusedCell ? `${headers[focusCol]?.s}: ${cellLabel(focusedCell)}` : ""}
  />
{/if}

<style>
  .table-container {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 120%;
  }

  table {
    box-sizing: border-box;
    transform: translateX(0.5rem);
    min-width: calc(100% - 1rem);
    border-collapse: collapse;
    table-layout: fixed;
    overflow-x: auto;
  }

  table input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: none;
    background: none;
    text-align: center;
  }

  table button {
    width: 3rem;
    height: 3rem;
    margin: 0.25rem;
    border: 1px solid var(--dark-color);
    box-shadow: 2px 2px 2px 0 var(--dark-color);
    background-color: var(--background-color);
    text-align: center;
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  }

  table button:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 4px var(--dark-color);
  }

  table button:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--dark-color);
  }

  th, td {
    height: 2.5rem;
    border: 2px solid var(--secondary-color);
    text-align: center;
  }

  .focused {
    box-shadow: inset 0 0 3px 3px var(--primary-color);
  }
</style>
