import { redirect } from '@sveltejs/kit';
import { getIdentifiersFromViewId } from '$lib/server/leaderboard/lookups';
import { getData } from '$lib/server/leaderboard/data';
import { getTemplateFull } from '$lib/server/template/data';

export async function load({ params }) {
  const { id: view_id } = params;

  let id: string, template_id: number,
    lb: Awaited<ReturnType<typeof getData>>,
    template: Awaited<ReturnType<typeof getTemplateFull>>;

  try {
    ({ id, template_id } = await getIdentifiersFromViewId(view_id));
    [lb, template] = await Promise.all([getData(id), getTemplateFull(template_id)]);
  } catch (e) {
    throw redirect(307, '/leaderboard/join');
  }

  return {
    id,
    initial_lb: lb,
    template
  };
}
