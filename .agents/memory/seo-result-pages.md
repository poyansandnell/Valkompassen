---
name: SEO för resultatsidor
description: Hur publika resultatsidor görs Google-vänliga och hur webben serveras i produktion
---

# SEO för resultatsidor

- Webben serveras i produktion INTE längre statiskt: `artifacts/valkompass/server/index.mjs` (Express) servar dist/public, injicerar per-sida title/description/OG/canonical/robots för `/resultat/:slug` (data från API på `http://localhost:8080`, override `API_ORIGIN`) och genererar `/sitemap.xml` från `/api/result-pages-sitemap`.
- **Why:** ren statisk servering kan inte ge unika meta-taggar per resultatsida, vilket krävs för Google-indexering och delningskort.
- **How to apply:** ändringar i `index.html`-huvudet måste hålla meta-taggarnas exakta format (servern gör regex-ersättning). Artifact.toml ändras endast via `verifyAndReplaceArtifactToml`. `PUBLIC_WEB_ORIGIN=https://valkompassen.org` är satt som produktions-env för canonical/sitemap.
- Integritet: `isIndexable` är opt-in (default av) eftersom resultat är politiska åsikter; icke-indexerbara sidor får `noindex, follow` server-side.
- Express 5-fälla: `app.get("*")` kraschar (path-to-regexp v8); använd `app.use()`-fallback. Fallbacken är navigation-only (GET/HEAD + Accept: text/html, ej filändelser) så saknade statiska filer ger 404.
- Statisk OG-bild `public/og-image.png` genererad med sharp + DejaVu Sans (finns i Nix-miljön); regenerera med sharp-SVG vid ombranding.
