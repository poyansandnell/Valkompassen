import { pgTable, text } from "drizzle-orm/pg-core";

export const regionsTable = pgTable("regions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const municipalitiesTable = pgTable("municipalities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  regionId: text("region_id")
    .notNull()
    .references(() => regionsTable.id),
});

export type Region = typeof regionsTable.$inferSelect;
export type Municipality = typeof municipalitiesTable.$inferSelect;
