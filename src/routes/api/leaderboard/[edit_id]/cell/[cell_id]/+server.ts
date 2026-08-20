import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCell } from '$lib/server/leaderboard/data';
import { getIdFromEditId } from '$lib/server/leaderboard/lookups';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

const NUMERIC_FIELDS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'] as const;

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { edit_id, cell_id } = params;
  const body = await request.json();

  const data: Record<string, number | string> = {};
  for (const field of NUMERIC_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (body.s !== undefined) data.s = body.s;

  try {
    const cell = await updateCell(edit_id, Number(cell_id), data);
    const leaderboard_id = await getIdFromEditId(edit_id);
    broadcastPatch(leaderboard_id, { type: 'cell_updated', cell });

    return json({ cell }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
