import { index, integer, pgTable, varchar, boolean } from "drizzle-orm/pg-core";
import { templateTable } from "./template";

export const keyboardTable = pgTable("template_keyboard", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 63 }).notNull(),
  starts: boolean("starts").default(false).notNull(),
  columns: integer("columns").notNull(),
  rows: integer("rows").notNull(),
  template_id: integer("template_id").references(() => templateTable.id, { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("template_keyboard_template_id_idx").on(t.template_id),
]);

export const keyboardButtonTable = pgTable("keyboard_button", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 31 }).notNull(),
  icon: varchar("icon", { length: 31 }).notNull(),
  position: integer("position").notNull(),
  width: integer("width").default(1).notNull(),
  height: integer("height").default(1).notNull(),
  handler_name: varchar("handler_name", { length: 63 }).notNull(),
  keyboard_id: integer("keyboard_id").references(() => keyboardTable.id, { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("keyboard_button_keyboard_id_position_idx").on(t.keyboard_id, t.position),
]);
