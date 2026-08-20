import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const templateTable = pgTable("template", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).default("").notNull(),
  script: text("script").notNull(),
});
