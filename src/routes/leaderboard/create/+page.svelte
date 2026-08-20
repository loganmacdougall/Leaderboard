<script lang="ts">
  import HorizontalLeftSection from '$lib/components/HorizontalLeftSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';

  let { data } = $props();
  let search = $state('');

  let filtered = $derived(
    data.templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  );
</script>

<HorizontalMiddleSection>
  <h2>Choose a template</h2>
</HorizontalMiddleSection>

<HorizontalLeftSection>
  <label for="template_search">Search: </label>
  <input id="template_search" type="text" bind:value={search} placeholder="Search templates..." />
</HorizontalLeftSection>

<div class="template-list">
  {#each filtered as template (template.id)}
    <form method="POST">
      <input type="hidden" name="template_id" value={template.id} />
      <button type="submit" class="template-card">
        <strong>{template.name}</strong>
        {#if template.description}<p>{template.description}</p>{/if}
      </button>
    </form>
  {/each}
  {#if filtered.length === 0}
    <p>No templates match "{search}".</p>
  {/if}
</div>

<style>
  .template-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem;
  }

  .template-card {
    display: block;
    width: 100%;
    text-align: left;
    padding: 1rem;
  }

  .template-card strong {
    font-size: 24px;
  }

  .template-card p {
    margin: 0.5rem 0 0;
    font-size: 18px;
  }
</style>
