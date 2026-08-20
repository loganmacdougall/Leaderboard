import { redirect } from '@sveltejs/kit';
import { getIdentifiersFromEditId } from '$lib/server/leaderboard/lookups';
import { getData } from '$lib/server/leaderboard/data';

export async function load({ params }) {
  const { edit_id } = params;

  let id: string, view_id: string, lb: Awaited<ReturnType<typeof getData>>;

  try {
    ({ id, view_id } = await getIdentifiersFromEditId(edit_id));
    lb = await getData(id);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }

  return {
    id,
    view_id,
    edit_id,
    initial_lb: lb
  };
}