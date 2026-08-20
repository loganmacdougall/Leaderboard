import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { leaderboardCellTable, leaderboardHeaderCellTable, leaderboardMetadataTable, leaderboardRowTable, leaderboardTable } from "../schema/leaderboard";

function editIdSubquery(edit_id: string) {
  return db.select({ id: leaderboardTable.id }).from(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id));
}

export async function getMetadata(id: string) {
  const result = await db
    .select()
    .from(leaderboardMetadataTable)
    .where(eq(leaderboardMetadataTable.leaderboard_id, id))
    .limit(1)
    .execute();

  if (!result || result.length === 0) {
    throw new Error("Leaderboard metadata not found");
  }

  return result[0];
}

export async function updateMetadata(edit_id: string, data: Partial<typeof leaderboardMetadataTable.$inferInsert>) {
  const result = await db
    .update(leaderboardMetadataTable)
    .set(data)
    .where(inArray(leaderboardMetadataTable.leaderboard_id, editIdSubquery(edit_id)))
    .returning()
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard metadata not found");
  }

  return result[0];
}

export async function getHeaderCells(id: string) {
  return db
    .select()
    .from(leaderboardHeaderCellTable)
    .where(eq(leaderboardHeaderCellTable.leaderboard_id, id))
    .orderBy(leaderboardHeaderCellTable.display_order)
    .execute();
}

export async function createHeaderCell(edit_id: string) {
  return db.transaction(async (tx) => {
    const [{ id }] = await tx.select({ id: leaderboardTable.id }).from(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id)).execute();
    if (!id) throw new Error("Leaderboard not found");

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboardHeaderCellTable)
      .where(eq(leaderboardHeaderCellTable.leaderboard_id, id))
      .execute();

    const [header] = await tx
      .insert(leaderboardHeaderCellTable)
      .values({ leaderboard_id: id, display_order: count, s: "" })
      .returning()
      .execute();

    const rows = await tx.select({ id: leaderboardRowTable.id }).from(leaderboardRowTable).where(eq(leaderboardRowTable.leaderboard_id, id)).execute();

    let cells: (typeof leaderboardCellTable.$inferSelect)[] = [];
    if (rows.length > 0) {
      cells = await tx
        .insert(leaderboardCellTable)
        .values(rows.map((row) => ({ leaderboard_row_id: row.id, display_order: count })))
        .returning()
        .execute();
    }

    return { header, cells, leaderboard_id: id };
  });
}

export async function deleteHeaderCell(edit_id: string, header_id: number) {
  return db.transaction(async (tx) => {
    const [{ id }] = await tx.select({ id: leaderboardTable.id }).from(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id)).execute();
    if (!id) throw new Error("Leaderboard not found");

    const [header] = await tx
      .delete(leaderboardHeaderCellTable)
      .where(and(eq(leaderboardHeaderCellTable.id, header_id), eq(leaderboardHeaderCellTable.leaderboard_id, id)))
      .returning()
      .execute();

    if (!header) throw new Error("Header cell not found");

    await tx
      .delete(leaderboardCellTable)
      .where(and(
        eq(leaderboardCellTable.display_order, header.display_order),
        inArray(leaderboardCellTable.leaderboard_row_id, tx.select({ id: leaderboardRowTable.id }).from(leaderboardRowTable).where(eq(leaderboardRowTable.leaderboard_id, id)))
      ))
      .execute();

    await tx
      .update(leaderboardHeaderCellTable)
      .set({ display_order: sql`${leaderboardHeaderCellTable.display_order} - 1` })
      .where(and(eq(leaderboardHeaderCellTable.leaderboard_id, id), gt(leaderboardHeaderCellTable.display_order, header.display_order)))
      .execute();

    await tx
      .update(leaderboardCellTable)
      .set({ display_order: sql`${leaderboardCellTable.display_order} - 1` })
      .where(and(
        gt(leaderboardCellTable.display_order, header.display_order),
        inArray(leaderboardCellTable.leaderboard_row_id, tx.select({ id: leaderboardRowTable.id }).from(leaderboardRowTable).where(eq(leaderboardRowTable.leaderboard_id, id)))
      ))
      .execute();

    return { leaderboard_id: id, header_id: header.id };
  });
}

export async function getRowsWithCells(id: string) {
  const rows = await db
    .select()
    .from(leaderboardRowTable)
    .leftJoin(leaderboardCellTable, eq(leaderboardCellTable.leaderboard_row_id, leaderboardRowTable.id))
    .where(eq(leaderboardRowTable.leaderboard_id, id))
    .orderBy(leaderboardRowTable.display_order, leaderboardCellTable.display_order)
    .execute();

  return rows.reduce((acc, { leaderboard_row, leaderboard_cell }) => {
    const lastRow = acc[acc.length - 1];

    if (!lastRow || lastRow.id !== leaderboard_row.id) {
      acc.push({ ...leaderboard_row, cells: [] });
    }

    if (leaderboard_cell) {
      acc[acc.length - 1].cells.push(leaderboard_cell);
    }

    return acc;
  }, [] as (typeof leaderboardRowTable.$inferSelect & { cells: typeof leaderboardCellTable.$inferSelect[] })[]);
}

export async function createRow(edit_id: string) {
  return db.transaction(async (tx) => {
    const [{ id }] = await tx.select({ id: leaderboardTable.id }).from(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id)).execute();
    if (!id) throw new Error("Leaderboard not found");

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboardRowTable)
      .where(eq(leaderboardRowTable.leaderboard_id, id))
      .execute();

    const [row] = await tx
      .insert(leaderboardRowTable)
      .values({ leaderboard_id: id, display_order: count })
      .returning()
      .execute();

    const headers = await tx.select({ id: leaderboardHeaderCellTable.id }).from(leaderboardHeaderCellTable).where(eq(leaderboardHeaderCellTable.leaderboard_id, id)).execute();

    let cells: (typeof leaderboardCellTable.$inferSelect)[] = [];
    if (headers.length > 0) {
      cells = await tx
        .insert(leaderboardCellTable)
        .values(headers.map((_, i) => ({ leaderboard_row_id: row.id, display_order: i })))
        .returning()
        .execute();
    }

    return { row: { ...row, cells }, leaderboard_id: id };
  });
}

export async function deleteRow(edit_id: string, row_id: number) {
  return db.transaction(async (tx) => {
    const [{ id }] = await tx.select({ id: leaderboardTable.id }).from(leaderboardTable).where(eq(leaderboardTable.edit_id, edit_id)).execute();
    if (!id) throw new Error("Leaderboard not found");

    const [row] = await tx
      .delete(leaderboardRowTable)
      .where(and(eq(leaderboardRowTable.id, row_id), eq(leaderboardRowTable.leaderboard_id, id)))
      .returning()
      .execute();

    if (!row) throw new Error("Row not found");

    await tx
      .update(leaderboardRowTable)
      .set({ display_order: sql`${leaderboardRowTable.display_order} - 1` })
      .where(and(eq(leaderboardRowTable.leaderboard_id, id), gt(leaderboardRowTable.display_order, row.display_order)))
      .execute();

    return { leaderboard_id: id, row_id: row.id };
  });
}

export async function updateCell(edit_id: string, cell_id: number, data: Partial<typeof leaderboardCellTable.$inferInsert>) {
  const result = await db
    .update(leaderboardCellTable)
    .set(data)
    .where(and(
      eq(leaderboardCellTable.id, cell_id),
      inArray(
        leaderboardCellTable.leaderboard_row_id,
        db.select({ id: leaderboardRowTable.id }).from(leaderboardRowTable).where(inArray(leaderboardRowTable.leaderboard_id, editIdSubquery(edit_id)))
      )
    ))
    .returning()
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard cell not found");
  }

  return result[0];
}

export async function updateHeaderCell(edit_id: string, cell_id: number, data: Partial<typeof leaderboardHeaderCellTable.$inferInsert>) {
  const result = await db
    .update(leaderboardHeaderCellTable)
    .set(data)
    .where(
      and(
        inArray(leaderboardHeaderCellTable.leaderboard_id, editIdSubquery(edit_id)),
        eq(leaderboardHeaderCellTable.id, cell_id)
      )
    )
    .returning()
    .execute();

  if (result.length === 0) {
    throw new Error("Leaderboard header cell not found");
  }

  return result[0];
}

export async function getData(id: string) {
  const [metadata, headers, rows] = await Promise.all([
    getMetadata(id),
    getHeaderCells(id),
    getRowsWithCells(id)
  ]);

  return {
    metadata,
    headers,
    rows
  };
}
