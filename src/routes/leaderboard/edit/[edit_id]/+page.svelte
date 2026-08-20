<script lang="ts">
  import HorizontalLeftSection from '$lib/components/HorizontalLeftSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';
  import LeaderboardKeyboard from './LeaderboardKeyboard.svelte';

  type Cell = { id: number; display_order: number; n1: number; n2: number; s: string; leaderboard_row_id: number };
  type Row = { id: number; display_order: number; cells: Cell[] };
  type Header = { id: number; display_order: number; s: string };

  let { data } = $props();
  const edit_id: string = data.edit_id;

  let name = $state(data.initial_lb.metadata.name as string);
  let headers: Header[] = $state(data.initial_lb.headers);
  let rows: Row[] = $state(data.initial_lb.rows);

  let focusRow = $state(data.initial_lb.metadata.focus_row_id === null
    ? -1
    : rows.findIndex((r: Row) => r.id === data.initial_lb.metadata.focus_row_id));
  let focusCol = $state(data.initial_lb.metadata.focus_header_id === null
    ? -1
    : headers.findIndex((h: Header) => h.id === data.initial_lb.metadata.focus_header_id));

  const focusedCell = $derived(
    (focusRow !== -1 && focusCol !== -1) ? rows[focusRow]?.cells[focusCol] : undefined
  );

  const cellScore = (cell: Cell) => cell.s.includes('2') ? 2 * cell.n1 + cell.n2 : cell.n1 + cell.n2;
  const isLocked = (cell: Cell) => cell.s.includes('L');
  const cellLabel = (cell: Cell | undefined) => {
    if (!cell) return '';
    return `${cellScore(cell)}${cell.s.includes('2') ? ' x2' : ''}${isLocked(cell) ? ' 🔒' : ''}`;
  };

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

  async function patchCell(cell: Cell, patch: Partial<Pick<Cell, 'n1' | 'n2' | 's'>>) {
    Object.assign(cell, patch);
    await fetch(`/api/leaderboard/${edit_id}/cell/${cell.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  const addNCell = (n: number) => {
    const cell = focusedCell;
    if (!cell || isLocked(cell)) return;
    patchCell(cell, { n1: cell.n1 + n });
  };

  const setCellZero = () => {
    const cell = focusedCell;
    if (!cell || isLocked(cell)) return;
    patchCell(cell, { n1: 0, n2: 0 });
  };

  const toggleX2 = () => {
    const cell = focusedCell;
    if (!cell || isLocked(cell)) return;
    patchCell(cell, { s: cell.s.includes('2') ? cell.s.replace('2', '') : cell.s + '2' });
  };

  const setLock = (locked: boolean) => {
    const cell = focusedCell;
    if (!cell) return;
    const base = cell.s.replace('L', '');
    patchCell(cell, { s: locked ? base + 'L' : base });
  };

  async function addRow() {
    const res = await fetch(`/api/leaderboard/${edit_id}/row`, { method: 'POST' });
    if (!res.ok) return;
    const { row } = await res.json();
    rows.push(row);
    return row;
  }

  const focusDown = async () => {
    if (focusRow === -1) {
      if (rows.length === 0) await addRow();
      const col = focusCol === -1 ? (headers.length > 0 ? 0 : -1) : focusCol;
      await setFocus(0, col);
      return;
    }

    if (focusRow === rows.length - 1) {
      await addRow();
    }

    await setFocus(focusRow + 1, focusCol);
  };

  const focusUp = async () => {
    if (focusRow > 0) await setFocus(focusRow - 1, focusCol);
  };

  const focusLeft = async () => {
    if (focusCol === -1 || headers.length === 0) return;
    await setFocus(focusRow, focusCol > 0 ? focusCol - 1 : headers.length - 1);
  };

  const focusRight = async () => {
    if (focusCol === -1 || headers.length === 0) return;
    await setFocus(focusRow, focusCol < headers.length - 1 ? focusCol + 1 : 0);
  };

  const addHeader = async () => {
    const res = await fetch(`/api/leaderboard/${edit_id}/header`, { method: 'POST' });
    if (!res.ok) return;
    const { header, cells } = await res.json();
    headers.push(header);
    for (const cell of cells as Cell[]) {
      const row = rows.find((r) => r.id === cell.leaderboard_row_id);
      if (row) row.cells.push(cell);
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
            <button class="header_button" onclick={focusDown}>⬇️</button>
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



<LeaderboardKeyboard labels={
  ["+1", "+2", "+3", "=0", "x2", "+4", "+5", "+6", "⬇️", "⬆️", "+7", "+8", "+9", "⬅️", "➡️", "+10", "+11", "+12", "🔒", "🔑"]
}
listeners={[
  () => { addNCell(1) },
  () => { addNCell(2) },
  () => { addNCell(3) },
  () => { setCellZero() },
  () => { toggleX2() },
  () => { addNCell(4) },
  () => { addNCell(5) },
  () => { addNCell(6) },
  focusDown,
  focusUp,
  () => { addNCell(7) },
  () => { addNCell(8) },
  () => { addNCell(9) },
  focusLeft,
  focusRight,
  () => { addNCell(10) },
  () => { addNCell(11) },
  () => { addNCell(12) },
  () => { setLock(true) },
  () => { setLock(false) },
]}
cols={5}
label={focusedCell ? `${headers[focusCol]?.s}: ${cellLabel(focusedCell)}` : ""}/>

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
