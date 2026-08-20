<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';

  let { data } = $props();
  let search = $state('');

  let filtered = $derived(
    data.templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  );
</script>

<div class="wrap">
  <div class="intro">
    <h2>Choose a template</h2>
    <p>Each template comes with its own keyboard and scoring rules — pick the game you're playing, or use the plain point tracker for anything else.</p>
  </div>

  <div class="search-bar">
    <span class="search-icon"><Icon name="search" size={16} /></span>
    <input id="template_search" type="text" bind:value={search} placeholder="Search templates..." />
  </div>

  <div class="template-list">
    {#each filtered as template (template.id)}
      <form method="POST">
        <input type="hidden" name="template_id" value={template.id} />
        <button type="submit" class="template-card">
          <strong>{template.name}</strong>
          {#if template.description}<p>{template.description}</p>{/if}
          <span class="use-link">Use this template →</span>
        </button>
      </form>
    {/each}
    {#if filtered.length === 0}
      <p class="empty">No templates match "{search}".</p>
    {/if}
  </div>
</div>

<style>
  .wrap {
    max-width: 860px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 3rem;
  }

  .intro {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .intro h2 {
    margin: 0 0 0.5rem;
  }

  .intro p {
    max-width: 34rem;
    margin: 0 auto;
  }

  .search-bar {
    position: relative;
    max-width: 26rem;
    margin: 0 auto 2rem;
  }

  .search-icon {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    color: var(--text-secondary);
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border-radius: 999px;
  }

  .template-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .empty {
    grid-column: 1 / -1;
    text-align: center;
  }

  .template-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    text-align: left;
    padding: 1.5rem;
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .template-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
  }

  .template-card strong {
    font-size: 1.15rem;
    color: var(--text-primary);
  }

  .template-card p {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    flex: 1;
  }

  .use-link {
    margin-top: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
  }
</style>
