<script lang="ts">
  import BlockedSection from '$lib/components/BlockedSection.svelte';
  import HorizontalMiddleSection from '$lib/components/HorizontalMiddleSection.svelte';
  import LinkButton from '$lib/components/LinkButton.svelte';
</script>

<BlockedSection>
  <h1>Leaderboard</h1>
  <p>Create, Edit, and View a Leaderboard</p>
  <p>Live syncing across all devices</p>
  <p>Fast, simple, reliable</p>
</BlockedSection>

<HorizontalMiddleSection>
  <LinkButton href="/leaderboard/create"> Create Leaderboard </LinkButton>
  <LinkButton href="/leaderboard/join"> View Leaderboard </LinkButton>
</HorizontalMiddleSection>


<style>
  p {
    margin: 0.5rem 0;
    text-align: center;
  }
</style>
