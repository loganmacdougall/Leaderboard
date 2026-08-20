import { leaderboardExists } from '$lib/server/leaderboard/lookups';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';


export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'Invalid leaderboard code' });
    }

    const exists = await leaderboardExists(id);
    if (!exists) {
      return fail(404, { error: 'Leaderboard not found' });
    }
    
    throw redirect(303, `/leaderboard/view/${id}`);
  }
} satisfies Actions;