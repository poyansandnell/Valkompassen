---
name: Party answer data model
description: How real vs. test party answers are handled across election levels in Valkompass
---

# Party answer data

- ALL levels now use real editorial assessments (scale -2..2); no test data remains, all parties `isTestData=false`.
- Riksdag matrix: `scripts/src/riksdagAnswers.ts` (sources = party policy pages). Region/kommun matrices: `scripts/src/localAnswers.ts` — riksdag parties' local branches get riks-fallback assessments with a justification saying the local branch hasn't published local positions.
- Katrineholm FRAMÅT (user's party): real local positions from katrineholmframat.se, nulls where the program is silent → 20/25 answered, so NOT qualified (<90%). Sörmlandslistan: no answers at all (nothing published).
- **Why:** user wanted riks-fallback for local branches, clearly labelled so it reads as "party hasn't stated local positions", never as an app bug. Live scraping in-app was rejected (slow, unreliable, unreviewable).
- **How to apply:** update matrices, re-run `pnpm --filter @workspace/scripts run seed` (it asserts matrix length = question count). Never present editorial assessments as party-submitted; parties can replace them via portal (origin "party").
