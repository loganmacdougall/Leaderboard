import { redirect } from '@sveltejs/kit';
import { getLeaderboardData } from '$lib/server/leaderboard';

export async function load({ params }) {
  const { id } = params;
  
  let lb: any;

  try {
    lb = getLeaderboardData(id);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }
  
  return {
    id,
    initial_lb: lb
  };
}