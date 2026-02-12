import { redirect } from '@sveltejs/kit';
import { getIdFromEditId, getLeaderboardData } from '$lib/server/leaderboard';

export async function load({ params }) {
  const { edit_id } = params;
  
  let id: string, lb: any;

  try {
    id = getIdFromEditId(edit_id);
    lb = getLeaderboardData(id);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }

  return {
    id,
    edit_id,
    initial_lb: lb
  };
}