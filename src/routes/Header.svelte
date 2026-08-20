<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  let theme: 'light' | 'dark' = $state('light');

  onMount(() => {
    const stored = localStorage.getItem('theme');
    theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
</script>

<header>
  <a class="brand" href="/">
    <span class="brand-mark">L</span>
    <h2>Leaderboard</h2>
  </a>
  <nav>
    <a href="/leaderboard/create">Create</a>
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle dark mode">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
    </button>
    <a class="cta" href="/leaderboard/join"><span class="full">View a leaderboard</span><span class="short">View</span></a>
  </nav>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background-color: var(--surface);
    border-bottom: 1px solid var(--border-color);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    flex-shrink: 1;
    text-decoration: none;
  }

  .brand h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .brand-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--text-on-accent);
    font-weight: 800;
    font-size: 1.1rem;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .cta .short {
    display: none;
  }

  nav a {
    text-decoration: none;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.15s ease;
  }

  nav a:hover {
    color: var(--text-primary);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background-color: var(--surface);
    color: var(--text-secondary);
  }

  .theme-toggle:hover {
    color: var(--text-primary);
    border-color: var(--text-secondary);
  }

  nav a.cta {
    color: var(--text-on-accent);
    background-color: var(--accent);
    padding: 0.55rem 1rem;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
    transition: background-color 0.15s ease, transform 0.1s ease;
  }

  nav a.cta:hover {
    background-color: var(--accent-hover);
    color: var(--text-on-accent);
  }

  nav a.cta:active {
    transform: translateY(1px);
  }

  @media only screen and (max-width: 600px) {
    header {
      padding: 0.85rem 1rem;
    }

    nav {
      gap: 0.6rem;
    }

    nav a:not(.cta) {
      display: none;
    }

    nav a.cta {
      padding: 0.5rem 0.85rem;
      font-size: 0.9rem;
    }
  }

  @media only screen and (max-width: 380px) {
    .cta .full {
      display: none;
    }

    .cta .short {
      display: inline;
    }
  }
</style>
