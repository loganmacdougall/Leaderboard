import { SQL, sql } from "drizzle-orm";
import { index, integer, uuid, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { templateTable } from "./template";

export const leaderboardTable = pgTable("leaderboard", {
  id: uuid("id").primaryKey(),
  edit_id: uuid("edit_id").defaultRandom().unique().notNull(),
  view_id: varchar("view_id", { length: 8 }).unique().notNull(),
  template_id: integer("template_id").references(() => templateTable.id).notNull(),
}, (t) => [
  index("leaderboard_template_id_idx").on(t.template_id),
])

export const leaderboardMetadataTable = pgTable("leaderboard_metadata", {
  leaderboard_id: uuid("leaderboard_id").primaryKey().references(() => leaderboardTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).default("Leaderboard").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  updated_id: integer("updated_id").default(0).notNull()
    .$onUpdate((): SQL<unknown> => sql`${leaderboardMetadataTable.updated_id} + 1`),
  focus_row_id: integer("focus_row_id").references(() => leaderboardRowTable.id, { onDelete: "set null" }),
  focus_header_id: integer("focus_header_id").references(() => leaderboardHeaderCellTable.id, { onDelete: "set null" }),
  last_row_id: integer("last_row_id").references(() => leaderboardRowTable.id, { onDelete: "set null" }),
})

export const leaderboardRowTable = pgTable("leaderboard_row", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  display_order: integer("display_order").notNull(),
  leaderboard_id: uuid("leaderboard_id").references(() => leaderboardTable.id,  { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("leaderboard_row_leaderboard_id_display_order_idx").on(t.leaderboard_id, t.display_order),
])

export const leaderboardCellTable = pgTable("leaderboard_cell", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  display_order: integer("display_order").notNull(),
  n1: integer("n1").default(0).notNull(),
  n2: integer("n2").default(0).notNull(),
  n3: integer("n3"),
  n4: integer("n4"),
  n5: integer("n5"),
  n6: integer("n6"),
  n7: integer("n7"),
  n8: integer("n8"),
  s: varchar("s", { length: 16 }).default("").notNull(),
  leaderboard_row_id: integer("leaderboard_row_id").references(() => leaderboardRowTable.id,  { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("leaderboard_cell_row_id_display_order_idx").on(t.leaderboard_row_id, t.display_order),
])

export const leaderboardHeaderCellTable = pgTable("leaderboard_header_cell", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  display_order: integer("display_order").notNull(),
  s: varchar("s", { length: 128 }).default("").notNull(),
  leaderboard_id: uuid("leaderboard_id").references(() => leaderboardTable.id,  { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("leaderboard_header_cell_leaderboard_id_display_order_idx").on(t.leaderboard_id, t.display_order),
])