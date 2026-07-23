# Valkompass

## Overview
Independent Swedish election compass (valkompass) for the 2026 elections: riksdag, region and kommun. No login for regular users. Swedish-only UI. Strictly politically neutral. All seeded political data is TEST DATA (parties flagged `isTestData`, justifications labelled "Testdata").

## Architecture
pnpm monorepo:
- `artifacts/valkompass` — React + Vite web app (wouter, TanStack Query). All matching is computed locally on the device in `src/lib/matching.ts`; user answers persist in localStorage only.
- `artifacts/api-server` — Express 5 + pino. Routes in `src/routes/` (geo, quiz, parties, resultPages, challenges, stats). Server-side mirror of the matching engine in `src/lib/matching.ts` (used for challenge comparisons only).
- `lib/api-spec/openapi.yaml` — API contract; codegen via `pnpm --filter @workspace/api-spec run codegen` (generates `@workspace/api-zod` + `@workspace/api-client-react`).
- `lib/db` — Drizzle schema: regions, municipalities, parties, party_participation, questions, party_answers, result_pages (+reports), challenges, completion_events.
- `scripts/src/seed.ts` — seed: 21 regions, 290 municipalities, 8 national parties + 2 local test parties (Katrineholm FRAMÅT, Sörmlandslistan), 100 test questions (riksdag 30, generic region 25, Katrineholm 25, generic kommun 20), deterministic test answers. Run: `pnpm --filter @workspace/scripts run seed`.

## Key rules
- Matching: `likhet = 1 - |user - party| / 4`, weights 0.75/1/1.5/2.25, weighted average → 0–100 %. Skipped questions and missing party positions excluded. No hidden bonuses ever.
- Parties shown alphabetically before results; by match after. Party qualified when ≥90 % of questions answered.
- Public result pages: edit/delete tokens stored only as SHA-256 hashes; plaintext returned once at creation. `noindex` by default. Challenges expire after ~90 days and never reveal the sender's individual answers.
- Neutral wording everywhere: never "rösta på X" / "bästa partiet"; use "högst sakpolitisk matchning".
- Question fallbacks: area-specific questions if seeded, otherwise generic level fallback (regionId/municipalityId null). Party fallback for unseeded areas: national parties.

## User preferences
(none recorded yet)
