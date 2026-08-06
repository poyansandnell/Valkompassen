import {
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Partiernas egna inskickade svar (självrapportering).
// OBS: inga FK-kolumner mot parties/questions — tabellen ska överleva
// seed-körningar som tömmer och återskapar dessa tabeller.
// status: pending_email -> (verifierad, domän matchar) approved
//                       -> (verifierad, ingen domänmatch) pending_review
//                       -> approved | rejected (manuell granskning via mejl)
export const partySubmissionsTable = pgTable("party_submissions", {
  id: serial("id").primaryKey(),
  partyId: text("party_id").notNull(),
  level: text("level").notNull(),
  regionId: text("region_id"),
  municipalityId: text("municipality_id"),
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name"),
  // questionId -> värde (-2..2) eller null (inget svar)
  answers: jsonb("answers").$type<Record<string, number | null>>().notNull(),
  status: text("status").notNull().default("pending_email"),
  domainMatch: boolean("domain_match").notNull().default(false),
  verifyTokenHash: text("verify_token_hash").notNull(),
  reviewTokenHash: text("review_token_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PartySubmission = typeof partySubmissionsTable.$inferSelect;
