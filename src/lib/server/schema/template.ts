import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const templateTable = pgTable("template", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull()
});