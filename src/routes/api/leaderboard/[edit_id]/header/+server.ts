import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHeaderCell } from '$lib/server/leaderboard/data';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const POST: RequestHandler = async ({ params }) => {
  const { edit_id } = params;

  try {
    const { header, cells, leaderboard_id } = await createHeaderCell(edit_id);
    broadcastPatch(leaderboard_id, { type: 'header_created', header, cells });

    return json({ header, cells }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
