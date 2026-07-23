import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { municipalitiesTable, regionsTable } from "./geo";

export const partiesTable = pgTable("parties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  abbreviation: text("abbreviation").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  website: text("website"),
  isTestData: boolean("is_test_data").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Where a party runs for election. level: riksdag | region | kommun.
// regionId/municipalityId are null for riksdag (national participation).
export const partyParticipationTable = pgTable("party_participation", {
  id: serial("id").primaryKey(),
  partyId: text("party_id")
    .notNull()
    .references(() => partiesTable.id),
  level: text("level").notNull(),
  regionId: text("region_id").references(() => regionsTable.id),
  municipalityId: text("municipality_id").references(
    () => municipalitiesTable.id,
  ),
  // Whether the party currently holds seats in the relevant assembly
  // (riksdag / regionfullmäktige / kommunfullmäktige) for this participation.
  inAssembly: boolean("in_assembly").notNull().default(false),
});

export type Party = typeof partiesTable.$inferSelect;
export type PartyParticipation = typeof partyParticipationTable.$inferSelect;
