<script lang="ts">
  type Props = {
    children?: any;
    href?: string;
  };

  let { children, href }: Props = $props();
</script>

<a href={href ?? '#'}>
  {@render children()}
</a>

<style>
  a {
    text-decoration: none;
    color: var(--background-color);
    background-color: var(--primary-color);
    border: 4px solid var(--secondary-color);
    display: inline-block;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.25);
    transition: background-color 0.3s;
  }

  a:hover {
    background-color: var(--secondary-color);
  }
</style>