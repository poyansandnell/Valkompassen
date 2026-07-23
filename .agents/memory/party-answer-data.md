---
name: Party answer data model
description: How real vs. test party answers are handled across election levels in Valkompass
---

# Party answer data

- Riksdag answers are REAL editorial assessments (scale -2..2) sourced from each party's official policy pages; matrix lives in `scripts/src/riksdagAnswers.ts` (RIKSDAG_POSITIONS + PARTY_SOURCES). answerOrigin "editorial", parties `isTestData=false`.
- Region (Sörmland) and kommun (Katrineholm) answers are still generated test data. The quiz API overrides `isTestData=true` per party for non-riksdag levels, so the TESTDATA badge shows only there.
- **Why:** the user wants the riksdag test fully real; local positions aren't publicly documented enough to assess. Parties can later submit real answers (origin "party"), then the level override should be revisited.
- **How to apply:** when updating party positions, edit `riksdagAnswers.ts` and re-run `pnpm --filter @workspace/scripts run seed`. Never present editorial assessments as party-submitted; results screens must note "redaktionellt bedömda".
