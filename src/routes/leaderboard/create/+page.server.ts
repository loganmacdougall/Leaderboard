import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { listTemplates } from '$lib/server/template/data';
import { createLeaderboard } from '$lib/server/leaderboard/create';

export async function load() {
  const templates = await listTemplates();
  return { templates };
}

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const template_id = Number(formData.get('template_id'));

    if (!template_id || Number.isNaN(template_id)) {
      return fail(400, { error: 'Invalid template' });
    }

    const { edit_id } = await createLeaderboard(template_id);
    throw redirect(303, `/leaderboard/edit/${edit_id}`);
  }
} satisfies Actions;
