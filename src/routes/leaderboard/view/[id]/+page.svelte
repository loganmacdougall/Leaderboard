<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { createSandbox, destroySandbox, runScoreFunction, runDisplayFunction, runSortDirection, type Sandbox } from '$lib/sandbox';

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
  let sortAscending = $state(false);

  const DEFAULT_COLOR = 'var(--color-green)';
  const COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$|^var\(--color-[a-z]+\)$/;

  function sanitizeColor(color: unknown): string {
    return typeof color === 'string' && COLOR_PATTERN.test(color) ? color : DEFAULT_COLOR;
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
      const [color, text] = await Promise.all([
        runDisplayFunction(sandbox, 'getColor', displayPlayer),
        runDisplayFunction(sandbox, 'getText', displayPlayer)
      ]);
      playerColors = { ...playerColors, [headerId]: sanitizeColor(color) };
      playerTexts = { ...playerTexts, [headerId]: typeof text === 'string' ? text : '' };
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

    const eventSource = new EventSource(`/api/leaderboard/stream/${id}`);
    let event_data: any;

    eventSource.onmessage = (event) => {
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

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
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

<h2>{name}</h2>
<div class="leaderboard" style="--row-count: {rowCount};">
{#each players as player, i (player.id)}
  <div class={`player-row${player.id === focusHeaderId ? " focus-player" : ""}`} style={`background-color: ${playerColors[player.id] ?? DEFAULT_COLOR};`} animate:flip={{ duration: 1000, easing: quintOut }}>
    <div>
      <span class="player-rank"><em>{i + 1}.</em></span>
      <span class="player-name">{player.name}{playerTexts[player.id] ? ` ${playerTexts[player.id]}` : ''}</span>
    </div>
    <div class="player-scores">
      <span class="player-score">{player.score}</span>
      <span class="player-plus" style={player.plus === 0 ? 'opacity: 0;' : ''}>+{player.plus}</span>
    </div>
  </div>
{/each}
</div>

<style>
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 2px solid var(--secondary-color);
  border-radius: 0.5rem;
  color: var(--background-color);
  font-size: 1.5rem;
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.focus-player {
  box-shadow: 8px 8px 8px rgba(0, 0, 0, 0.25);
  transform: translate(-4px, -4px);
}

.player-rank {
  margin-right: 1rem;
}

.player-name {
  font-weight: bold;
}

.player-scores {
  display: flex;
  gap: 1rem;
}

.player-score {
  font-weight: bold;
}

.player-plus {
  min-width: 3rem;
  margin-left: 0.5rem;
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

  .player-row {
    font-size: 2.5rem;
  }

  .player-plus {
    margin-left: 1rem;
  }
}

</style>
