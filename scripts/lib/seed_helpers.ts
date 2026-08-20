import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/server/db';
import { templateTable } from '../../src/lib/server/schema/template';
import { keyboardTable, keyboardButtonTable } from '../../src/lib/server/schema/keyboard';

export type ButtonDef = {
  name: string;
  icon: string;
  handler_name: string;
  position: number;
  width?: number;
  height?: number;
};

export type KeyboardDef = {
  name: string;
  starts: boolean;
  columns: number;
  rows: number;
  buttons: ButtonDef[];
};

// Idempotent: re-running after editing a template's script/keyboards updates it in
// place instead of leaving stale rows behind under a duplicate name. Existing
// leaderboards that reference this template are untouched — they only point at the
// template row itself, not its keyboards.
export async function upsertTemplate(name: string, description: string, script: string, keyboards: KeyboardDef[]) {
  const existing = await db.select().from(templateTable).where(eq(templateTable.name, name)).limit(1).execute();

  let template: typeof templateTable.$inferSelect;
  if (existing.length > 0) {
    [template] = await db
      .update(templateTable)
      .set({ description, script })
      .where(eq(templateTable.id, existing[0].id))
      .returning()
      .execute();
    await db.delete(keyboardTable).where(eq(keyboardTable.template_id, template.id)).execute();
  } else {
    [template] = await db.insert(templateTable).values({ name, description, script }).returning().execute();
  }

  for (const kb of keyboards) {
    const [keyboard] = await db
      .insert(keyboardTable)
      .values({ name: kb.name, starts: kb.starts, columns: kb.columns, rows: kb.rows, template_id: template.id })
      .returning()
      .execute();

    await db.insert(keyboardButtonTable).values(
      kb.buttons.map((b) => ({
        name: b.name,
        icon: b.icon,
        handler_name: b.handler_name,
        position: b.position,
        width: b.width ?? 1,
        height: b.height ?? 1,
        keyboard_id: keyboard.id
      }))
    ).execute();
  }

  console.log(`Seeded template "${name}" with id ${template.id}`);
  return template;
}
