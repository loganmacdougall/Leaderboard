import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { templateTable } from "./template";

export const viewTable = pgTable("view", {
  template_id: integer("template_id").references(() => templateTable.id, { onDelete: "cascade" }),
  sort_function: varchar("sort_function", { length: 1023 }).notNull(),
  display_function: varchar("display_function", { length: 8191 }).notNull()
});