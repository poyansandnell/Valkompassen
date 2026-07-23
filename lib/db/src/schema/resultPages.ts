import {
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type PartyMatchSummaryJson = {
  partyName: string;
  partyAbbreviation: string;
  partySlug: string;
  partyColor: string;
  matchPercent: number;
  basedOnQuestions: number;
  totalQuestions: number;
};

export type TopicAgreementJson = {
  category: string;
  agreementPercent: number;
};

export const resultPagesTable = pgTable("result_pages", {
  id: serial("id").primaryKey(),
  publicSlug: text("public_slug").notNull().unique(),
  level: text("level").notNull(),
  areaName: text("area_name").notNull(),
  displayName: text("display_name"),
  locality: text("locality"),
  comment: text("comment"),
  showBestParty: boolean("show_best_party").notNull().default(false),
  showFullList: boolean("show_full_list").notNull().default(false),
  showTopics: boolean("show_topics").notNull().default(false),
  isIndexable: boolean("is_indexable").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  editTokenHash: text("edit_token_hash").notNull(),
  deleteTokenHash: text("delete_token_hash").notNull(),
  topMatches: jsonb("top_matches")
    .$type<PartyMatchSummaryJson[]>()
    .notNull()
    .default([]),
  topicAgreements: jsonb("topic_agreements")
    .$type<TopicAgreementJson[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const resultPageReportsTable = pgTable("result_page_reports", {
  id: serial("id").primaryKey(),
  publicSlug: text("public_slug").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("rapporterad"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ResultPage = typeof resultPagesTable.$inferSelect;
export type ResultPageReport = typeof resultPageReportsTable.$inferSelect;
