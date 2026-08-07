/**
 * Produktionsserver för Valkompassen-webben.
 *
 * Utöver att servera de statiskt byggda filerna (dist/public) gör den två
 * saker som gör resultatsidorna Google-vänliga:
 *  1. GET /resultat/:slug — injicerar unik titel, beskrivning, OG-taggar,
 *     canonical och robots-direktiv i index.html per publicerad resultatsida.
 *  2. GET /sitemap.xml — genererar en sitemap med alla statiska sidor plus
 *     alla resultatsidor som ägaren markerat som sökbara.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "dist", "public");
const PORT = Number(process.env.PORT ?? 26109);

// API:t körs i samma deployment på sin egen port.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

// Publik bas-URL för canonical-länkar och sitemap.
function publicOrigin() {
  const explicit = process.env.PUBLIC_WEB_ORIGIN;
  if (explicit) return explicit.replace(/\/+$/, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return "http://localhost";
}

const indexHtml = readFileSync(join(PUBLIC_DIR, "index.html"), "utf8");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Byt ut <title>, description, OG/Twitter-taggar och robots i index.html. */
function renderMeta({ title, description, url, robots }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let html = indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${d}" />`,
    )
    .replace(
      /<meta name="robots" content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${robots}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${t}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${d}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${t}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${d}" />`,
    );
  // Canonical + og:url per sida.
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${escapeHtml(url)}" />\n    <meta property="og:url" content="${escapeHtml(url)}" />\n  </head>`,
  );
  return html;
}

const app = express();
app.disable("x-powered-by");

function fetchWithTimeout(url, ms = 5000) {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

// Resultatsidor: unik metadata per sida.
app.get("/resultat/:slug", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const r = await fetchWithTimeout(
      `${API_ORIGIN}/api/result-pages/${encodeURIComponent(req.params.slug)}`,
    );
    if (r.ok) {
      const page = await r.json();
      const name = page.displayName || "Ett valkompassresultat";
      const best =
        page.showBestParty && page.topMatches?.[0]
          ? ` – ${page.topMatches[0].matchPercent}% match med ${page.topMatches[0].partyName}`
          : "";
      const levelName =
        page.level === "riksdag"
          ? "riksdagsvalet"
          : page.level === "region"
            ? "regionvalet"
            : "kommunvalet";
      const title = `${name}s valkompassresultat${best} | Valkompassen 2026`;
      const description = `${name} har gjort Valkompassen för ${levelName} i ${page.areaName}${best}. Gör testet du också och jämför era resultat på valkompassen.org.`;
      const url = `${publicOrigin()}/resultat/${page.publicSlug}`;
      res
        .status(200)
        .type("html")
        .send(
          renderMeta({
            title,
            description,
            url,
            robots: page.isIndexable ? "index, follow" : "noindex, follow",
          }),
        );
      return;
    }
    if (r.status === 404) {
      // Okänd/raderad sida: SPA-fallback med 404-status (klienten visar 404-vy).
      res.status(404).type("html").send(indexHtml);
      return;
    }
    // Oväntat API-fel: temporärt fel, be crawlers återkomma.
    res.status(503).setHeader("Retry-After", "60");
    res.type("html").send(indexHtml);
  } catch (err) {
    console.error("Kunde inte hämta resultatsida för meta:", err);
    res.status(503).setHeader("Retry-After", "60");
    res.type("html").send(indexHtml);
  }
});

// Sitemap: statiska sidor + alla sökbara resultatsidor.
app.get("/sitemap.xml", async (_req, res) => {
  const origin = publicOrigin();
  const staticPaths = [
    "/",
    "/val/riksdag",
    "/val/region",
    "/val/kommun",
    "/sa-fungerar-det",
    "/om",
    "/metod",
    "/kallor",
    "/partisvar",
  ];
  let resultUrls = [];
  try {
    const r = await fetchWithTimeout(`${API_ORIGIN}/api/result-pages-sitemap`);
    if (r.ok) resultUrls = await r.json();
    else {
      res.status(503).setHeader("Retry-After", "60").end();
      return;
    }
  } catch (err) {
    console.error("Kunde inte hämta resultatsidor till sitemap:", err);
    res.status(503).setHeader("Retry-After", "60").end();
    return;
  }
  const urls = [
    ...staticPaths.map((p) => `  <url><loc>${origin}${p}</loc></url>`),
    ...resultUrls.map(
      (u) => `  <url><loc>${origin}/resultat/${escapeHtml(u.slug)}</loc></url>`,
    ),
  ].join("\n");
  res
    .setHeader("Cache-Control", "public, max-age=3600")
    .type("application/xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// Statiska filer med cache (index.html hanteras av fallbacken nedan).
app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// SPA-fallback — endast för sidnavigeringar (GET/HEAD som accepterar HTML).
// Saknade statiska filer (t.ex. gamla /assets/*.js) ska få 404, inte HTML.
app.use((req, res) => {
  const wantsHtml = (req.headers.accept ?? "").includes("text/html");
  const looksLikeFile = /\.[a-z0-9]+$/i.test(req.path);
  if ((req.method !== "GET" && req.method !== "HEAD") || !wantsHtml || looksLikeFile) {
    res.status(404).end();
    return;
  }
  res.status(200).setHeader("Cache-Control", "no-store").type("html").send(indexHtml);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Valkompassen-webben lyssnar på port ${PORT}`);
});
