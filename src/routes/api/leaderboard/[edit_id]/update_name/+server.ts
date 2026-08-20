import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { updateMetadata } from '$lib/server/leaderboard/data';
import { broadcastPatch } from '$lib/server/leaderboard/realtime';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { edit_id } = params;
		const { name } = await request.json();

		if (!edit_id || !name) {
			return json(
				{ error: 'Missing required parameters: edit_id and name' },
				{ status: 400 }
			);
		}

		const metadata = await updateMetadata(edit_id, { name });
		broadcastPatch(metadata.leaderboard_id, { type: 'metadata', metadata });

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error updating name:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
