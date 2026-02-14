<script lang="ts">
  type Props = {
    labels: string[];
    listeners: (() => void)[];
    cols: number;
    label?: string;
  };

  let { labels, listeners, cols, label }: Props = $props();
  let open = $state(false);
</script>

<div class="keyboard" style="transform: {open ? 'translateY(0)' : 'translateY(calc(100% - 4.5rem))'};">
  <div class="show-button-container">
    <span>{label || ""}</span>
    <button class="show-button" onclick={() => {open = !open}}>Show</button>
  </div>
  <div class="keyboard-keys" style="grid-template-columns: repeat({cols}, 1fr);grid-template-rows: repeat({labels.length / cols}, 1fr);">
    {#each labels as label, i}
      <button onclick={listeners[i]}>{label}</button>
    {/each}
  </div>
</div>

<style>
  .keyboard {
    position: fixed;
    bottom: 0;
    width: calc(100% - 1rem);
    height: 50%;
    margin: 0 0.5rem;
    box-sizing: border-box;
    border: 4px solid var(--secondary-color);
    border-radius: 1rem;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
    overflow: hidden;
    transition: transform 0.3s ease-in-out;
    background-color: var(--primary-color);
    color: var(--background-color);
    opacity: 0.90;
  }

  .show-button-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 1rem;
    height: 3.5rem;
    font-size: 1rem;
    box-sizing: border-box;
    background-color: var(--primary-color);
    color: var(--background-color);
  }

  .show-button {
    position: relative;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .keyboard-keys {
    display: grid;
    padding: 1rem;
    gap: 0.5rem;
    height: calc(100% - 2rem);
    box-sizing: border-box;
  }
</style>