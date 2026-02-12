import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLeaderboard } from "$lib/server/leaderboard";

export const GET: RequestHandler = ({}) => {
    const { edit_id } = createLeaderboard()
    throw redirect(307, `/leaderboard/edit/${edit_id}`);
}