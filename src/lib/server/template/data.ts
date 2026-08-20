import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { templateTable } from "../schema/template";
import { keyboardTable, keyboardButtonTable } from "../schema/keyboard";

export async function listTemplates() {
  return db
    .select({ id: templateTable.id, name: templateTable.name, description: templateTable.description })
    .from(templateTable)
    .orderBy(asc(templateTable.name))
    .execute();
}

export async function getTemplateFull(template_id: number) {
  const [template] = await db
    .select()
    .from(templateTable)
    .where(eq(templateTable.id, template_id))
    .limit(1)
    .execute();

  if (!template) {
    throw new Error("Template not found");
  }

  const keyboardRows = await db
    .select()
    .from(keyboardTable)
    .where(eq(keyboardTable.template_id, template_id))
    .execute();

  const buttonRows = keyboardRows.length > 0
    ? await db
        .select()
        .from(keyboardButtonTable)
        .where(inArray(keyboardButtonTable.keyboard_id, keyboardRows.map((k) => k.id)))
        .orderBy(asc(keyboardButtonTable.position))
        .execute()
    : [];

  const keyboards = keyboardRows.map((keyboard) => ({
    ...keyboard,
    buttons: buttonRows.filter((b) => b.keyboard_id === keyboard.id)
  }));

  return { template, keyboards };
}
