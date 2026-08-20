import { createLeaderboard } from "$lib/server/leaderboard/create";
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { template_id } = await request.json();

  if (typeof template_id !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing template_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, edit_id, view_id } = await createLeaderboard(template_id);

  return new Response(JSON.stringify({ id, edit_id, view_id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
