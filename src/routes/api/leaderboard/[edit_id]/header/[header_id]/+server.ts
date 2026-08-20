import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteHeaderCell, updateHeaderCell } from '$lib/server/leaderboard/data';
import { getIdFromEditId } from '$lib/server/leaderboard/lookups';
import { broadcastLeaderboard } from '$lib/server/leaderboard/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { edit_id, header_id } = params;
  const { s } = await request.json();

  try {
    const header = await updateHeaderCell(edit_id, Number(header_id), { s });
    const id = await getIdFromEditId(edit_id);
    await broadcastLeaderboard(id);

    return json({ header }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { edit_id, header_id } = params;

  try {
    const id = await getIdFromEditId(edit_id);
    await deleteHeaderCell(edit_id, Number(header_id));
    await broadcastLeaderboard(id);

    return json({ success: true }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
