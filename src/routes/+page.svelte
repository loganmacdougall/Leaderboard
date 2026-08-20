<script lang="ts">
  import BlockedSection from '$lib/components/BlockedSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';
  import LinkButton from '$lib/components/LinkButton.svelte';

  const viewExample = {
    title: 'Game Night',
    players: [
      { name: 'Jordan', score: 184, plus: 12 },
      { name: 'Sam', score: 156, plus: 0 },
      { name: 'Casey', score: 129, plus: 6 }
    ]
  };

  const miniPlayers = ['P1', 'P2', 'P3'];
  const miniRows = [
    ['14', '27', '9'],
    ['22', '—', '31']
  ];
  const miniKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
</script>

<div class="hero">
  <BlockedSection>
    <h1>Leaderboards without the headache</h1>
    <p class="lede">Start a leaderboard, share the code with your group, and everyone watches the score update in real time — on any device, for any game.</p>
  </BlockedSection>

  <HorizontalMiddleSection>
    <LinkButton href="/leaderboard/create" variant="primary">Create a leaderboard</LinkButton>
    <LinkButton href="/leaderboard/join" variant="secondary">Join with a code</LinkButton>
  </HorizontalMiddleSection>
  <p class="no-signup">No sign-up required — just create and share the code.</p>

  <div class="preview">
    <div class="preview-grid">
      <div class="preview-col">
        <div class="preview-frame">
          <div class="preview-chrome">
            <span class="preview-url">/leaderboard/view/[JoinCode]</span>
            <span class="dot-group"><span class="dot dot-1"></span><span class="dot dot-2"></span><span class="dot dot-3"></span></span>
          </div>
          <div class="preview-body">
            <span class="preview-title">{viewExample.title}</span>
            {#each viewExample.players as player, i}
              <div class={`preview-card${i === 0 ? ' rank-first' : ''}`}>
                <span class="preview-rank">{i + 1}</span>
                <span class="preview-name">{player.name}</span>
                <div class="preview-scores">
                  <span class="preview-score">{player.score}</span>
                  <span class="preview-plus" style={player.plus ? '' : 'opacity: 0;'}>+{player.plus}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <p class="preview-caption"><span class="live-dot"></span>What everyone watching sees — updating the instant a score changes.</p>
      </div>

      <div class="preview-col">
        <div class="preview-frame">
          <div class="preview-chrome">
            <span class="preview-url">/leaderboard/edit/[EditCode]</span>
            <span class="dot-group"><span class="dot dot-1"></span><span class="dot dot-2"></span><span class="dot dot-3"></span></span>
          </div>
          <div class="edit-preview-body">
            <table class="mini-table">
              <thead>
                <tr>
                  <th class="mini-corner">+</th>
                  {#each miniPlayers as p}<th class="mini-head-cell">{p}</th>{/each}
                </tr>
              </thead>
              <tbody>
                {#each miniRows as row, i}
                  <tr>
                    <td class="mini-corner">{i + 1}</td>
                    {#each row as value, j}
                      <td class={i === 0 && j === 1 ? 'mini-focused' : ''}>{value}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
            <div class="mini-keyboard">
              {#each miniKeys as key}<span class="mini-key">{key}</span>{/each}
            </div>
          </div>
        </div>
        <p class="preview-caption"><span class="live-dot"></span>Built for fast, one-handed scoring on any phone.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .hero {
    max-width: 960px;
    margin: 0 auto;
    padding: 4rem 1.5rem 3rem;
  }

  .no-signup {
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .lede {
    max-width: 42rem;
    font-size: 1.15rem;
    margin: 0.5rem 0 2rem;
  }

  .preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 4rem;
  }

  .preview-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    align-items: center;
    gap: 2rem;
  }

  .preview-col {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preview-frame {
    width: 100%;
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .edit-preview-body {
    background-color: var(--surface);
  }

  /* A real <table> with collapsed borders — mirrors the actual edit page's table
     (src/routes/leaderboard/edit/[edit_id]/+page.svelte) instead of a gapped card
     grid, so this reads as an accurate miniature of the real thing. */
  .mini-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--surface);
  }

  .mini-table th,
  .mini-table td {
    height: 1.75rem;
    border: 1px solid var(--border-color);
    text-align: center;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .mini-head-cell {
    background-color: var(--surface-alt);
    color: var(--text-secondary);
    font-size: 0.68rem;
  }

  .mini-corner {
    width: 1.5rem;
    background-color: var(--surface-alt);
    color: var(--text-secondary);
    font-size: 0.68rem;
    font-weight: 600;
  }

  .mini-focused {
    background-color: color-mix(in srgb, var(--accent) 12%, var(--surface-alt));
    border-color: var(--accent);
    color: var(--accent);
  }

  .mini-keyboard {
    padding: 0.6rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.35rem;
    background-color: var(--dark-color);
  }

  .mini-key {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.9rem;
    border-radius: 0.4rem;
    background-color: var(--key-bg);
    color: var(--color-white);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .preview-chrome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    background-color: var(--surface-alt);
    border-bottom: 1px solid var(--border-color);
  }

  /* Window controls sit on the right, like a normal title bar (not macOS traffic
     lights) — matches where minimize/maximize/close actually live. */
  .dot-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
  }

  .dot-1 { background-color: var(--color-red); }
  .dot-2 { background-color: var(--color-yellow); }
  .dot-3 { background-color: var(--color-green); }

  .preview-url {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  }

  .preview-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .preview-title {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  /* Mirrors the real view page's .player-card/.rank-badge/.player-info/.player-scores
     structure (src/routes/leaderboard/view/[id]/+page.svelte) so this mockup reads as
     an accurate preview rather than a simplified stand-in. */
  .preview-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    background-color: color-mix(in srgb, var(--color-green) 8%, var(--surface-alt));
    border: 1px solid color-mix(in srgb, var(--color-green) 25%, var(--border-color));
    border-left: 4px solid var(--color-green);
    border-radius: var(--radius-sm);
  }

  .preview-rank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    flex-shrink: 0;
    border-radius: 50%;
    background-color: var(--surface);
    border: 2px solid var(--color-green);
    font-weight: 800;
    font-size: 0.8rem;
    color: var(--text-primary);
  }

  .rank-first .preview-rank {
    background-color: var(--color-green);
    color: var(--color-white);
  }

  .preview-name {
    flex: 1;
    font-weight: 700;
    color: var(--text-primary);
  }

  .preview-scores {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .preview-score {
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .preview-plus {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .preview-caption {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1.25rem 0 0;
    font-size: 0.9rem;
    max-width: 26rem;
    text-align: center;
  }

  .live-dot {
    width: 0.5rem;
    height: 0.5rem;
    flex-shrink: 0;
    border-radius: 50%;
    background-color: var(--color-green);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-green) 20%, transparent);
  }

  @media only screen and (max-width: 600px) {
    .hero {
      padding: 2.5rem 1.25rem 2rem;
    }
  }
</style>
