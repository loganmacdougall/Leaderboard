import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLeaderboard } from "$lib/server/leaderboard/create";

export const GET: RequestHandler = async ({}) => {
    const { edit_id } = await createLeaderboard();
    throw redirect(307, `/leaderboard/edit/${edit_id}`);
}