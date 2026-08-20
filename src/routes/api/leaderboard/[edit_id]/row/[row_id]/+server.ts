import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteRow } from '$lib/server/leaderboard/data';
import { getIdFromEditId } from '$lib/server/leaderboard/lookups';
import { broadcastLeaderboard } from '$lib/server/leaderboard/realtime';

export const DELETE: RequestHandler = async ({ params }) => {
  const { edit_id, row_id } = params;

  try {
    const id = await getIdFromEditId(edit_id);
    await deleteRow(edit_id, Number(row_id));
    await broadcastLeaderboard(id);

    return json({ success: true }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
