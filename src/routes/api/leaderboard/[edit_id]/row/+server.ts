import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRow } from '$lib/server/leaderboard/data';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const POST: RequestHandler = async ({ params }) => {
  const { edit_id } = params;

  try {
    const { row, leaderboard_id } = await createRow(edit_id);
    broadcastPatch(leaderboard_id, { type: 'row_created', row });

    return json({ row }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
