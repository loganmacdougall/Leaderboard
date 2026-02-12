<script lang="ts">
  let { children } = $props();
</script>

<section>{@render children()}</section>

<style>
  section {
    background-color: var(--primary-color);
    color: var(--background-color);
    box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }
</style>