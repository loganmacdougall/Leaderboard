import { getMetadata } from '$lib/server/leaderboard/data';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id!
	const result = await getMetadata(id);
  
  return new Response(JSON.stringify({ id: params.id, metadata: result }), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
