---
name: Partiernas självrapportering
description: Hur partiers egna svar skickas in, verifieras och överlever seed
---

Flöde: `/partisvar` (web) → POST `/api/party-submissions` → bekräftelsemejl (Resend-connector) → verify-länk. Domänmatch (mejladressens domän = eller subdomän till partiets webbdomän, aldrig omvänt) ⇒ auto-godkänd; annars pending_review + mejl till `ADMIN_EMAIL` med länk till granskningssida (GET visar, POST godkänner/avvisar — atomisk statusövergång mot dubbelklick).

- Godkända svar skriver över party_answers med origin `party`; tabellen `party_submissions` saknar FK:er och töms INTE av seed — seed återapplicerar godkända inskick sist.
- **Why:** seed tömmer alla svarstabeller; utan återapplicering försvinner partisvar vid varje seed-körning.
- Resend-connectorn gav 401 "API key is invalid" (aug 2026) — användaren måste lägga in giltig Resend-nyckel i integrationen; utan verifierad egen domän i Resend kan mejl dessutom bara skickas till kontoägarens adress.
- HTML-escapa alltid användarfält i mejl/HTML-sidor (XSS mot admins mejlklient).
