# Memory index

- [Neutrality wording policy](neutrality-wording.md) — describe the service as oberoende, never claim the people behind it are politically inactive.

- [localStorage persistence race](localstorage-persistence-race.md) — persist client state synchronously in the setState updater, never via useEffect; effect-based writes drop the last update before navigation.
