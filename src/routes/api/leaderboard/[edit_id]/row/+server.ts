import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRow } from '$lib/server/leaderboard/data';
import { getIdFromEditId } from '$lib/server/leaderboard/lookups';
import { broadcastLeaderboard } from '$lib/server/leaderboard/realtime';

export const POST: RequestHandler = async ({ params }) => {
  const { edit_id } = params;

  try {
    const { row } = await createRow(edit_id);
    const id = await getIdFromEditId(edit_id);
    await broadcastLeaderboard(id);

    return json({ row }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
