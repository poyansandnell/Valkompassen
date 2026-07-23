---
name: localStorage persistence race
description: Why client state hooks in this project must persist synchronously, not in useEffect
---

Persisting React state to localStorage via `useEffect` silently drops the final update when a state change is immediately followed by navigation — the component unmounts before the effect runs.

**Why:** In Valkompass this lost the last quiz answer and the completed flag (user saw "29 av 30"), and lost the chosen municipality (kommun quiz fell back to national parties without local ones).

**How to apply:** Any hook that mirrors state to localStorage must write synchronously and OUTSIDE React's state queue. Writing inside the setState updater is ALSO unreliable — React can drop the queued updater when the component unmounts right after (the "29 av 30" bug recurred with that pattern). Correct pattern: mirror state in a `useRef`, compute next from the ref, `localStorage.setItem` immediately, then `setState(next)`. See `artifacts/valkompass/src/hooks/use-local-answers.ts`. Also guard pages that depend on such state (e.g. quiz/results redirect to the picker when municipality is missing) instead of silently falling back.
