import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteRow } from '$lib/server/leaderboard/data';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const DELETE: RequestHandler = async ({ params }) => {
  const { edit_id, row_id } = params;

  try {
    const { leaderboard_id, row_id: deleted_id } = await deleteRow(edit_id, Number(row_id));
    broadcastPatch(leaderboard_id, { type: 'row_deleted', row_id: deleted_id });

    return json({ success: true }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
