import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { municipalitiesTable, regionsTable } from "./geo";
import { partiesTable } from "./parties";

export type SourceRef = { title: string; url: string; date?: string | null };

// Questions per election level. regionId/municipalityId scope the question to
// a specific area; null means the question is a generic fallback for its level.
export const questionsTable = pgTable("questions", {
  id: text("id").primaryKey(),
  level: text("level").notNull(),
  regionId: text("region_id").references(() => regionsTable.id),
  municipalityId: text("municipality_id").references(
    () => municipalitiesTable.id,
  ),
  text: text("text").notNull(),
  category: text("category").notNull(),
  orderIndex: integer("order_index").notNull(),
  explanation: text("explanation"),
  moreInfo: text("more_info"),
  sources: jsonb("sources").$type<SourceRef[]>().notNull().default([]),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// value: -2..2, null = no established position.
// answerOrigin: party | editorial | none
export const partyAnswersTable = pgTable("party_answers", {
  id: serial("id").primaryKey(),
  partyId: text("party_id")
    .notNull()
    .references(() => partiesTable.id),
  questionId: text("question_id")
    .notNull()
    .references(() => questionsTable.id),
  value: integer("value"),
  answerOrigin: text("answer_origin").notNull().default("none"),
  justification: text("justification"),
  sources: jsonb("sources").$type<SourceRef[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Question = typeof questionsTable.$inferSelect;
export type PartyAnswer = typeof partyAnswersTable.$inferSelect;
