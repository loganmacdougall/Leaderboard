<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  let { data } = $props();
  const { id } = data;

  let lb: any = $state({});

  let name = $derived(lb.name || 'Leaderboard');
  let focus = $derived(lb?.focus ?? -1);
  let round = $derived(lb.round || 0);
  let header: string[] = $derived(lb.header || []);
  let grids: number[] = $derived(lb.grids || []);

  let rows = $derived(grids.length > 0 && header.length > 0 ? Math.ceil(grids.length / header.length) : 0);
  let focus_row = $derived((focus !== -1 && header.length > 0) ? Math.floor(focus / header.length) : -1);
  let focus_player = $derived((focus !== -1 && header.length > 0) ? header[focus % header.length] : "");
  let players = $derived.by(() => {
    if (rows == 0) return [];

    let p: {name: string, score: number, plus: number, locked: bool}[] = [];
    for (let c = 0; c < header.length; c++) {
      p.push({name: header[c], score: 0, plus: 0, locked: false});
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < header.length; c++) {
        const index = r * header.length + c;
        const cell = (grids?.[index] ?? "") === "" ? "U 0" : grids[index];
        const [status, value] = cell.split(" ");
        const locked = status === "L";
        const score = parseInt(value);

        if (r > focus_row) {
          p[c].plus += score;
        } else if (r === focus_row) {
          p[c].plus += score;
          p[c].locked = locked;
        } else {
          p[c].score += score;
        }

      }
    }

    console.log(focus, focus_row);
    console.log(p);
    return p.sort((a, b) => b.score - a.score);
  })
  
  onMount(() => {
    const eventSource = new EventSource(`/api/leaderboard/stream/${id}`);
    let data: any;

    eventSource.onmessage = (event) => {
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
        data = {};
      }

      lb = data.lb || {};
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
{#each players as player, i (player.name)}
  <div class={`player-row${(player.name === focus_player) ? " focus-player" : ""}`} style={`background-color: var(--color-${player.locked ? "yellow" : "green"});`} animate:flip={{ duration: 1000, easing: quintOut }}>
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
