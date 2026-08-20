<script lang="ts">
  let { form } = $props();
</script>

<div class="wrap">
  <div class="card">
    <h2>Enter the leaderboard code</h2>
    <p class="hint">Ask the host for their 8-letter code, or scan their QR code.</p>

    <form method="POST">
      <input
        type="text"
        name="id"
        placeholder="ABCDEFGH"
        maxlength="8"
        autocomplete="off"
        autocapitalize="characters"
        class="code-input"
        required
      >
      <button type="submit">Join leaderboard</button>
    </form>

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
  </div>
</div>

<style>
  .wrap {
    display: flex;
    justify-content: center;
    padding: 3rem 1.25rem;
  }

  .card {
    width: 100%;
    max-width: 26rem;
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: 2.25rem 2rem;
    text-align: center;
  }

  h2 {
    margin: 0 0 0.4rem;
  }

  .hint {
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .code-input {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    font-weight: 700;
    font-size: 1.15rem;
    padding: 0.9rem;
  }

  button[type="submit"] {
    color: var(--text-on-accent);
    background-color: var(--accent);
    border: 1.5px solid transparent;
    padding: 0.85rem;
    box-shadow: var(--shadow-sm);
  }

  button[type="submit"]:hover {
    background-color: var(--accent-hover);
  }

  .error {
    margin: 1rem 0 0;
    color: var(--color-red);
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
