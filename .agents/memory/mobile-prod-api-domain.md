---
name: Mobile prod API domain failsafe
description: Why the mobile app hardcodes a fallback API domain and shows error URLs
---

Rule: the mobile app must never depend solely on `EXPO_PUBLIC_DOMAIN` being inlined at EAS build time — `_layout.tsx` falls back to the production domain `attached-assets-y1phu.replit.app` if the env var is missing, and every network-error screen shows the exact URL/status via `lib/errorInfo.ts`.

**Why:** The first TestFlight build (1.0 build 1) failed on all levels ("Kunde inte hämta frågorna", no location prompt) because it was likely built before the `EXPO_PUBLIC_DOMAIN` env existed in eas.json — the app then called `https://undefined/...`. The backend was healthy the whole time. Without on-screen error URLs it was impossible to diagnose from TestFlight.

**How to apply:** Keep the fallback in sync if the production domain ever changes (also in eas.json, all three profiles). When TestFlight shows fetch failures, check the URL printed in the error view first. Note: the location-permission prompt is intentionally gated on a successful municipalities fetch, so API failures also suppress the prompt.
