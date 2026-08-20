import { redirect } from '@sveltejs/kit';
import { getIdentifiersFromEditId } from '$lib/server/leaderboard/lookups';
import { getData } from '$lib/server/leaderboard/data';
import { getTemplateFull } from '$lib/server/template/data';

export async function load({ params }) {
  const { edit_id } = params;

  let id: string, view_id: string, template_id: number,
    lb: Awaited<ReturnType<typeof getData>>,
    template: Awaited<ReturnType<typeof getTemplateFull>>;

  try {
    ({ id, view_id, template_id } = await getIdentifiersFromEditId(edit_id));
    [lb, template] = await Promise.all([getData(id), getTemplateFull(template_id)]);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }

  return {
    id,
    view_id,
    edit_id,
    initial_lb: lb,
    template
  };
}
