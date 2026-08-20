import { integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { templateTable } from "./template";
import { leaderboardTable } from "./leaderboard";

export const viewTable = pgTable("view", {
  sort_function: varchar("sort_function", { length: 1023 }).notNull(),
  display_function: varchar("display_function", { length: 8191 }).notNull(),
  template_id: integer("template_id").references(() => templateTable.id, { onDelete: "cascade" }),
  leaderboard_id: uuid("leaderboard_id").references(() => leaderboardTable.id, { onDelete: "cascade" }),
});