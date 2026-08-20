<script lang="ts">
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
      >{button.icon}</button>
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
    display: flex;
    flex-direction: column;
  }
  .show-button-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem 0 1.25rem;
    height: 3.5rem;
    flex-shrink: 0;
    font-size: 1rem;
    box-sizing: border-box;
    background-color: var(--primary-color);
    color: var(--background-color);
  }
  .show-button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
.keyboard-keys {
    display: grid;
    padding: 0rem 1rem 1rem 1rem;
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
}

/* Tuned for fast, one-handed thumb tapping: no double-tap-zoom delay, no accidental
   text selection or callout on a long press, immediate visual feedback on tap so a
   dealer entering scores at speed can trust a press registered without looking twice. */
.key {
    min-height: 44px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
}

.key:active {
    transform: scale(0.94);
    box-shadow: inset 0 0 0 3px var(--background-color);
}
</style>
