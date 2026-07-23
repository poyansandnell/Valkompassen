import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type StoredUserAnswer = {
  questionId: string;
  value: number | null;
  weight: number;
};

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  level: text("level").notNull(),
  areaName: text("area_name").notNull(),
  municipalityId: text("municipality_id"),
  senderName: text("sender_name"),
  answers: jsonb("answers").$type<StoredUserAnswer[]>().notNull(),
  completedCount: integer("completed_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const completionEventsTable = pgTable("completion_events", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Challenge = typeof challengesTable.$inferSelect;
