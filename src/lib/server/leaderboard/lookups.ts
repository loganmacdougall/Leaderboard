import { eq } from 'drizzle-orm';
import { db } from '../db';
import { leaderboardTable } from '../schema/leaderboard';

export async function getIdFromEditId(edit_id: string) {
  const result = await db
    .select({ id: leaderboardTable.id })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.edit_id, edit_id))
    .limit(1)
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard not found");
  }

  return result[0].id;
}

export async function getIdentifiersFromEditId(edit_id: string) {
  const result = await db
    .select({ id: leaderboardTable.id, view_id: leaderboardTable.view_id, template_id: leaderboardTable.template_id })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.edit_id, edit_id))
    .limit(1)
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard not found");
  }

  return result[0];
}

export async function getIdFromViewId(view_id: string) {
  const result = await db
    .select({ id: leaderboardTable.id })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.view_id, view_id))
    .limit(1)
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard not found");
  }

  return result[0].id;
}

export async function getIdentifiersFromViewId(view_id: string) {
  const result = await db
    .select({ id: leaderboardTable.id, template_id: leaderboardTable.template_id })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.view_id, view_id))
    .limit(1)
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard not found");
  }

  return result[0];
}

export async function leaderboardExists(view_id: string) {
  try {
    await getIdFromViewId(view_id);
    return true;
  } catch {
    return false;
  }
}

export async function deleteLeaderboardFromEditID(edit_id: string) {
  await db.delete(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id)).execute();
}
