import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateMetadata } from '$lib/server/leaderboard/data';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { edit_id } = params;
  const { focus_row_id, focus_header_id } = await request.json();

  const data: { focus_row_id?: number | null; focus_header_id?: number | null } = {};
  if (focus_row_id !== undefined) data.focus_row_id = focus_row_id;
  if (focus_header_id !== undefined) data.focus_header_id = focus_header_id;

  try {
    const metadata = await updateMetadata(edit_id, data);
    broadcastPatch(metadata.leaderboard_id, { type: 'metadata', metadata });

    return json({ metadata }, { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, { status: 400 });
  }
};
