import { createLeaderboard } from "$lib/server/leaderboard/create";

export async function POST(_: Request) {
  let {id, edit_id, view_id} = await createLeaderboard();

  return new Response(JSON.stringify({id, edit_id, view_id}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
