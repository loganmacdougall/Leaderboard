import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCell } from '$lib/server/leaderboard/data';
import { getIdFromEditId } from '$lib/server/leaderboard/lookups';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { edit_id, cell_id } = params;
  const { n1, n2, s } = await request.json();

  const data: { n1?: number; n2?: number; s?: string } = {};
  if (n1 !== undefined) data.n1 = n1;
  if (n2 !== undefined) data.n2 = n2;
  if (s !== undefined) data.s = s;

  try {
    const cell = await updateCell(edit_id, Number(cell_id), data);
    const leaderboard_id = await getIdFromEditId(edit_id);
    broadcastPatch(leaderboard_id, { type: 'cell_updated', cell });

    return json({ cell }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
