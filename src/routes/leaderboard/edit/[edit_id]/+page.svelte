<script lang="ts">
  import HorizontalLeftSection from '$lib/components/HorizontalLeftSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';
  import LeaderboardKeyboard from './LeaderboardKeyboard.svelte';

  let { data } = $props();
  let id = $derived(data.id);
  let edit_id = $derived(data.edit_id);
  let initial_lb = $derived(data.initial_lb);

  console.log(id);

  let name = $state(initial_lb.name || '');
  let focus = $state(initial_lb?.focus ?? -1);
  let round = $state(initial_lb.round || 0);
  let header: string[] = $state(initial_lb.header || []);
  let grids: number[] = $state(initial_lb.grids || []);

  let lb = $derived({name, header, grids, focus, round});

  const pushChanges = () => {
    fetch(`/api/leaderboard/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({new_data: lb, edit_id})
    });
  }

  $effect(() => {
    lb;
    pushChanges();
  })

  const setCellValue = (n: number) => {
    if (focus === -1) return;
    const cell = getCell(focus);
    if (cell.locked) return;
    grids[focus] = `U ${n}`;
  }

  const getCell = (i: number): {locked: bool, value: number} => {
    const cell = grids[i];
    if (cell === undefined || cell === "") {
      return { locked: false, value: 0 };
    }
    return {
      locked: cell.startsWith("L"),
      value: parseInt(cell.slice(2))
    };
  }

  const addNCell = (n: number) => {
    if (focus === -1) return;
    const cell = getCell(focus);
    if (cell.locked) return;
    grids[focus] = `U ${cell.value + n}`;
  }

  const timesTwoCell = () => {
    if (focus === -1) return;
      const cell = getCell(focus);
      if (cell.locked) return;
      grids[focus] = `U ${cell.value * 2}`;
  }

  const setLock = (locked: bool) => {
    if (focus === -1) return;
    const cell = getCell(focus);
    grids[focus] = `${locked ? "L" : "U"} ${cell.value}`;
  }

  const focusDown = () => {
    if ((focus === -1 && grids.length === 0) || focus + header.length >= grids.length) {
      grids.push(...Array(header.length).fill(""));
      focus = grids.length - header.length;
    }

    if (focus !== -1 && focus + header.length < grids.length) {
      focus += header.length;
    }
  }

  const focusUp = () => {
    if (focus !== -1 && focus - header.length >= 0) {
      focus -= header.length;
    }
  }

  const focusLeft = () => {
    if (focus === -1) return;
    if (focus % header.length !== 0) {
      focus -= 1;
    } else {
      focus += header.length - 1;
    }
  }

  const focusRight = () => {
    if (focus === -1) return;
    if (focus % header.length !== header.length - 1) {
      focus += 1;
    } else {
      focus -= header.length - 1;
    }
  }

  const pushHeader = () => {
    header.push('');
    const new_index = header.length - 1;

    let new_grids = [];

    for (let r = 0; r < Math.ceil(grids.length / (header.length - 1)); r++) {
      for (let c = 0; c < header.length; c++) {
        const index = r * (header.length - 1) + c;
        if (c === new_index) {
          new_grids.push("");
        } else if (index < grids.length) {
          new_grids.push(grids[index]);
        }
      }
    }

    grids = new_grids;
  }

  const popHeaderAt = (i: number) => {
    let new_grids = [];

    for (let i = 0; i < grids.length; i++) {
      if (i % header.length !== i) {
        new_grids.push(grids[i]);
      }
    }

    header.splice(i, 1);

    grids = new_grids;
  }

  const popRowAt = (i: number) => {
    let new_grids = [];

    for (let r = 0; r < Math.ceil(grids.length / header.length); r++) {
      if (r === i) continue;
      for (let c = 0; c < header.length; c++) {
        const index = r * header.length + c;
        if (index < grids.length) {
          new_grids.push(grids[index]);
        }
      }
    }

    grids = new_grids;
  }

</script>

<HorizontalMiddleSection>
  <p>Viewing ID: {id}</p>
</HorizontalMiddleSection>

<HorizontalLeftSection>
  <label for="leaderboard_name">Name: </label>
  <input id="leaderboard_name" type="text" bind:value={name}>
</HorizontalLeftSection>

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>
          <div style="display: flex; flex-direction: row;">
            <button class="header_button" onclick={pushHeader}>+</button>
            <button class="header_button" onclick={focusDown}>⬇️</button>
          </div>
        </th>
        {#each header as _, i}
          <th><button class="header_button" onclick={() => {popHeaderAt(i)}}>-</button></th>
        {/each}
      </tr>
    </thead>
    <thead>
      <tr>
        <th>Round</th>
        {#each header as cell, i}
          <th><input bind:value={header[i]} /></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if header.length === 0}
        <!-- No headers: show each grid item as its own row -->
        {#each grids as cell, i}
          <tr class={i === focus ? 'focused' : ''}>
            <td>{i + 1}</td>
            <td>{cell}</td>
          </tr>
        {/each}
      {:else}
        <!-- With headers: show grid in rows -->
        {#each { length: Math.ceil(grids.length / header.length) } as _, rowIndex}
          <tr>
            <td><button class="header_button" onclick={() => {popRowAt(rowIndex)}}>-</button>{rowIndex + 1}</td>
            {#each header as _, colIndex}
              {@const cellIndex = rowIndex * header.length + colIndex}
              <td class={cellIndex === focus ? 'focused' : ''} onclick={() => {
                  if (focus === cellIndex) {
                    focus = -1;
                  } else {
                    focus = cellIndex;
                  }
                }}>
                {grids[cellIndex] ?? ''}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
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
  () => { setCellValue(0) },
  () => { timesTwoCell() },
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
label={focus > -1 ? `${header[focus % header.length]}: ${grids[focus]}` : ""}/>

<style>
  body {
    overflow-y: scroll;
  }

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