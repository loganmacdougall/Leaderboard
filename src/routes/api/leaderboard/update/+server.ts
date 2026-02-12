import { updateLeaderboard } from '$lib/server/leaderboard';
import type { RequestHandler } from './$types';

export const POST : RequestHandler = async ({ request }) => {
  const { edit_id, new_data } = await request.json();
  
  if (!edit_id) {
    return new Response('Missing id parameter', { status: 400 });
  }

  if (!new_data) {
    return new Response('Missing data parameter', { status: 400 });
  }

  let update_id: string;

  try {
    update_id = updateLeaderboard(edit_id, new_data);
  } catch (e) {
    return new Response(String(e), { status: 400 });
  }

  return new Response(update_id, { status: 200 });


}