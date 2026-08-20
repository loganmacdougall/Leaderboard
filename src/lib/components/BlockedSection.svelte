<script lang="ts">
  let { children } = $props();
</script>

<section>{@render children()}</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.35rem;
  }
</style>
