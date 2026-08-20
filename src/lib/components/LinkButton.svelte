<script lang="ts">
  type Props = {
    children?: any;
    href?: string;
    variant?: 'primary' | 'secondary';
  };

  let { children, href, variant = 'primary' }: Props = $props();
</script>

<a href={href ?? '#'} class={variant}>
  {@render children()}
</a>

<style>
  a {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9rem 1.75rem;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 1rem;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  }

  a.primary {
    color: var(--text-on-accent);
    background-color: var(--accent);
    box-shadow: var(--shadow-md);
    border: 1.5px solid transparent;
  }

  a.primary:hover {
    background-color: var(--accent-hover);
  }

  a.secondary {
    color: var(--text-primary);
    background-color: var(--surface);
    border: 1.5px solid var(--border-color);
    box-shadow: var(--shadow-sm);
  }

  a.secondary:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  a:active {
    transform: translateY(1px);
  }
</style>
