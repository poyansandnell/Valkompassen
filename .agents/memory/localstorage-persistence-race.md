---
name: localStorage persistence race
description: Why client state hooks in this project must persist synchronously, not in useEffect
---

Persisting React state to localStorage via `useEffect` silently drops the final update when a state change is immediately followed by navigation — the component unmounts before the effect runs.

**Why:** In Valkompass this lost the last quiz answer and the completed flag (user saw "29 av 30"), and lost the chosen municipality (kommun quiz fell back to national parties without local ones).

**How to apply:** Any hook that mirrors state to localStorage must write inside the setState updater (synchronously), never in a `useEffect`. See `artifacts/valkompass/src/hooks/use-local-answers.ts` for the pattern. Also guard pages that depend on such state (e.g. quiz/results redirect to the picker when municipality is missing) instead of silently falling back.
