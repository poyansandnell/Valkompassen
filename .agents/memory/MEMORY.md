# Memory index

- [Party answer data](party-answer-data.md) — riksdag answers are real editorial assessments with sources; region/kommun still test data, flagged per level in the quiz API.

- [Neutrality wording policy](neutrality-wording.md) — describe the service as oberoende, never claim the people behind it are politically inactive.

- [localStorage persistence race](localstorage-persistence-race.md) — persist client state synchronously in the setState updater, never via useEffect; effect-based writes drop the last update before navigation.

- [Fullmäktige mandate pipeline](mandate-data-pipeline.md) — inAssembly for all kommuner/regions comes from SCB; refresh after each election with update-mandates + seed; local parties stay manual.
