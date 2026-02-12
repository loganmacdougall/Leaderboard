<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();
  const { id } = data;

  let lb: any = $state({});

  let name = $derived(lb.name || 'Leaderboard');
  let focus = $derived(lb.focus || -1);
  let round = $derived(lb.round || 0);
  let header: string[] = $derived(lb.header || []);
  let grids: number[] = $derived(lb.grids || []);
  
  onMount(() => {
    const eventSource = new EventSource(`/api/leaderboard/stream/${id}`);
    let data: any;

    eventSource.onmessage = (event) => {
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
        data = {};
      }

      lb = data.lb || {};
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  });

</script>

<h2>{name}</h2>
