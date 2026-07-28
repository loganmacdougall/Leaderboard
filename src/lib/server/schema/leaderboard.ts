import { integer, uuid, pgTable, varchar } from "drizzle-orm/pg-core";

export const leaderboardTable = pgTable("leaderboard", {
  id: integer("id").primaryKey(),
  edit_id: uuid("edit_id").defaultRandom(),
  view_id: varchar("view_id", { length: 6 }).unique(),
})

export const leaderboardMetadataTable = pgTable("leaderboard_metadata", {
  name: varchar("name", { length: 255 }),
  focus_index: integer("focus_index"),
  focus_row: integer("focus_row"),
  leaderboard_id: integer("leaderboard_id").references(() => leaderboardTable.id,  { onDelete: "cascade" }),
})

export const leaderboardRowTable = pgTable("leaderboard_row", {
  id: integer("id").primaryKey(),
  display_order: integer("display_order").notNull(),
  leaderboard_id: integer("leaderboard_id").references(() => leaderboardTable.id,  { onDelete: "cascade" }),
})

export const leaderboardCell = pgTable("leaderboard_cell", {
  id: integer("id").primaryKey(),
  index: integer("index").notNull(),
  n1: integer("n1"),
  n2: integer("n2"),
  n3: integer("n3"),
  n4: integer("n4"),
  n5: integer("n5"),
  n6: integer("n6"),
  n7: integer("n7"),
  n8: integer("n8"),
  s: varchar("s", { length: 16 }),
  leaderboard_row_id: integer("leaderboard_row_id").references(() => leaderboardRowTable.id,  { onDelete: "cascade" }),
})