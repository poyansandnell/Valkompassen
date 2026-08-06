# Memory index

- [Party answer data](party-answer-data.md) — riksdag answers are real editorial assessments with sources; region/kommun still test data, flagged per level in the quiz API.

- [Neutrality wording policy](neutrality-wording.md) — describe the service as oberoende, never claim the people behind it are politically inactive.

- [localStorage persistence race](localstorage-persistence-race.md) — persist client state synchronously in the setState updater, never via useEffect; effect-based writes drop the last update before navigation.

- [Lokalpartiresearch](localparty-research.md) — hemsidor/beskrivningar/svar för 138 lokalpartier från deras egna sajter; strikt null-regel, fingerprint-skydd i seed, regenereras efter val.

- [Mobile prod API domain failsafe](mobile-prod-api-domain.md) — app hardcodes fallback API-domän + visar fel-URL på skärm; TestFlight-buggen berodde på saknad EXPO_PUBLIC_DOMAIN vid bygget, inte backend.

- [Partiernas självrapportering](party-self-report.md) — party_submissions överlever seed och återappliceras; domänmatch bara i riktningen mejl⊆webbdomän; Resend-nyckeln var ogiltig aug 2026.

- [Fullmäktige mandate pipeline](mandate-data-pipeline.md) — inAssembly for all kommuner/regions comes from SCB; refresh after each election with update-mandates + seed; local parties stay manual.
