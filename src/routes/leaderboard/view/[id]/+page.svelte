<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  type Cell = { id: number; display_order: number; n1: number; n2: number; s: string; leaderboard_row_id: number };
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

  const cellScore = (cell: Cell) => cell.s.includes('2') ? 2 * cell.n1 + cell.n2 : cell.n1 + cell.n2;
  const isLocked = (cell: Cell) => cell.s.includes('L');

  let players = $derived.by(() => {
    if (headers.length === 0) return [];

    const p = headers.map((h) => ({ id: h.id, name: h.s, score: 0, plus: 0, locked: false }));

    rows.forEach((row, r) => {
      row.cells.forEach((cell, c) => {
        if (!p[c]) return;
        const score = cellScore(cell);

        if (focusRowIndex === -1 || r < focusRowIndex) {
          p[c].score += score;
        } else if (r === focusRowIndex) {
          p[c].plus += score;
          p[c].locked = isLocked(cell);
        } else {
          p[c].plus += score;
        }
      });
    });

    return p.sort((a, b) => b.score - a.score);
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
        break;
      case 'row_deleted': {
        const i = lb.rows.findIndex((r) => r.id === patch.row_id);
        if (i !== -1) lb.rows.splice(i, 1);
        break;
      }
      case 'cell_updated': {
        for (const row of lb.rows) {
          const cell = row.cells.find((c) => c.id === patch.cell.id);
          if (cell) { Object.assign(cell, patch.cell); break; }
        }
        break;
      }
    }
  }

  onMount(() => {
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

</script>

<h2>{name}</h2>
<div class="leaderboard">
{#each players as player, i (player.id)}
  <div class={`player-row${player.id === focusHeaderId ? " focus-player" : ""}`} style={`background-color: var(--color-${player.locked ? "yellow" : "green"});`} animate:flip={{ duration: 1000, easing: quintOut }}>
    <div>
      <span class="player-rank"><em>{i + 1}.</em></span>
      <span class="player-name">{`${player.name}${player.locked ? " (inactive)" : ""}`}</span>
    </div>
    <div class="player-scores">
      <span class="player-score">{player.score}</span>
      <span class="player-plus" style={`color: var(--color-${((player.locked && player.plus === 0)) ? "red" : "white"});${(!player.locked && player.plus === 0) ? "opacity: 0;" : ""}`}>+{player.plus}</span>
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
  /* Make it a grid two column layout */
  .leaderboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
