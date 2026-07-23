---
name: Fullmäktige mandate data pipeline
description: How inAssembly data for all kommuner/regions is sourced and refreshed after elections
---

Fullmäktige membership (inAssembly) for all 21 regions and 290 kommuner comes from SCB's PxWeb statistics API (tables Kfmandat and Ltledamoter), not from manual seeding.

**Why:** the "sitter redan i fullmäktige" filter previously emptied the results in any non-seeded area; the user wants coverage everywhere and a refresh path after each election.

**How to apply:** after each election (SCB publishes final results a few months later), run `cd scripts && pnpm run update-mandates && pnpm run seed` — the update script auto-picks the latest election year. Quirks handled: Håbo/Habo slug collision (disambiguated by kommunkod), Gotland has no region election (regionfullmäktige = kommunfullmäktige), SCB includes historic municipalities like "Bara" which the seed skips. Local parties are lumped into SCB's "övriga" and must stay manually seeded (KF, Sörmlandslistan). The quiz API exposes `hasAssemblyData`; clients hide the filter when it is false. Fully automatic scheduled updates are not set up — it is a manual two-command step.

Local parties nationwide: `scripts/src/data/localParties.json` (149 parties) was generated from Valmyndigheten's "Mandatfördelning 2018–2022" xlsx — SCB lumps them as "övriga" so they cannot come from the PxWeb API. They appear in their kommun/region as "har inte lämnat svar" (no editorial assessments — deliberate neutrality decision; assess only on demand). After the 2026 election this file must be regenerated from Valmyndigheten's new mandatfördelning file, which is manual work unlike the SCB script.
