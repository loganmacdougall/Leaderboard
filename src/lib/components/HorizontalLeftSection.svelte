<script lang="ts">
  let { children } = $props();
</script>

<section>{@render children()}</section>

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    align-items: center;
    gap: 1rem;
  }
</style>