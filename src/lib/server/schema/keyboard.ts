import { integer, pgTable, varchar, boolean } from "drizzle-orm/pg-core";
import { templateTable } from "./template";

export const keyboardTable = pgTable("template_keyboard", {
  id: integer("id").primaryKey(),
  starts: boolean("starts").default(false).notNull(),
  columns: integer("columns").notNull(),
  rows: integer("rows").notNull(),
  template_id: integer("template_id").references(() => templateTable.id,  { onDelete: "cascade" }).notNull(),
});

export const keyboardButtonTable = pgTable("keyboard_button", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 31 }).notNull(),
  icon: varchar("icon", { length: 31 }).notNull(),
  position: integer("position").notNull(),
  width: integer("width").default(1).notNull(),
  height: integer("height").default(1).notNull(),
  code: varchar("code", { length: 1023 }),
  keyboard_id: integer("keyboard_id").references(() => keyboardTable.id,  { onDelete: "cascade" }).notNull(),
});