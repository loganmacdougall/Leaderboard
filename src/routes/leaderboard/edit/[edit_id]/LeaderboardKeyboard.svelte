<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';

  export type KeyboardButtonSpec = {
    id: number;
    name: string;
    icon: string;
    position: number;
    width: number;
    height: number;
    handler_name: string;
  };

  type Props = {
    buttons: KeyboardButtonSpec[];
    columns: number;
    rows: number;
    onPress: (button: KeyboardButtonSpec) => void;
    label?: string;
  };

  let { buttons, columns, rows, onPress, label }: Props = $props();

  // A button's `icon` is either a known icon keyword (rendered as a proper line icon)
  // or a plain label (numbers, "=0", "x2", "Bonus →", ...) rendered as text.
  const ICON_KEYWORDS = new Set(['arrow-down', 'arrow-up', 'arrow-left', 'arrow-right', 'lock', 'unlock', 'backspace']);
  // Open by default: this keyboard exists so a dealer can score at the pace cards are
  // being flipped — making them tap "Show" on every page load would work against that.
  let open = $state(true);

  // position is a uniform grid index (as if every button were 1x1); width/height then
  // let a button visually span extra cells from that starting position. A template
  // author placing a wide/tall button is responsible for leaving room in the following
  // positions, the same way you would with a hand-authored CSS grid-template-areas.
  const gridColumn = (position: number) => (position % columns) + 1;
  const gridRow = (position: number) => Math.floor(position / columns) + 1;
</script>

<div class="keyboard" style="transform: {open ? 'translateY(0)' : 'translateY(calc(100% - 3.5rem))'};">
  <div class="show-button-container">
    <span>{label || ""}</span>
    <button class="show-button" onclick={() => {open = !open}}>{open ? 'Hide' : 'Show'}</button>
  </div>
  <div class="keyboard-keys" style="grid-template-columns: repeat({columns}, 1fr); grid-template-rows: repeat({rows}, 1fr);">
    {#each buttons as button (button.id)}
      <button
        class="key"
        style="grid-column: {gridColumn(button.position)} / span {button.width}; grid-row: {gridRow(button.position)} / span {button.height};"
        onclick={() => onPress(button)}
        aria-label={button.name}
        title={button.name}
      >
        {#if ICON_KEYWORDS.has(button.icon)}
          <Icon name={button.icon} size={22} />
        {:else}
          {button.icon}
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .keyboard {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 50%;
    box-sizing: border-box;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    overflow: hidden;
    transition: transform 0.3s ease-in-out;
    background-color: var(--dark-color);
    color: var(--color-white);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  }
  .show-button-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem 0 1.25rem;
    height: 3.25rem;
    flex-shrink: 0;
    font-size: 0.95rem;
    font-weight: 600;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .show-button {
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-white);
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .show-button:hover {
    background-color: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.15);
  }
.keyboard-keys {
    display: grid;
    padding: 0.75rem;
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
}

/* Tuned for fast, one-handed thumb tapping: no double-tap-zoom delay, no accidental
   text selection or callout on a long press, immediate visual feedback on tap so a
   dealer entering scores at speed can trust a press registered without looking twice. */
.key {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--key-bg);
    color: var(--color-white);
    font-weight: 700;
    font-size: 1.05rem;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 2px 4px rgba(0, 0, 0, 0.25);
    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out, background-color 0.1s ease-out;
}

.key:hover {
    background-color: var(--key-bg-hover);
    border-color: transparent;
}

.key:active {
    transform: scale(0.94);
    background-color: var(--accent);
    box-shadow: none;
}
</style>
