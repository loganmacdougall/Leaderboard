import { redirect } from '@sveltejs/kit';
import { getIdFromViewId } from '$lib/server/leaderboard/lookups';
import { getData } from '$lib/server/leaderboard/data';

export async function load({ params }) {
  const { id: view_id } = params;

  let id: string, lb: Awaited<ReturnType<typeof getData>>;

  try {
    id = await getIdFromViewId(view_id);
    lb = await getData(id);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }

  return {
    id,
    initial_lb: lb
  };
}