/**
 * Hämtar mandatfördelningen i kommun- och regionfullmäktige från SCB:s
 * statistikdatabas och skriver scripts/src/data/mandates.json.
 *
 * Körs efter varje val (SCB publicerar slutligt resultat några månader efter
 * valdagen): `cd scripts && pnpm run update-mandates && pnpm run seed`.
 * Skriptet väljer automatiskt det senaste valår som finns i SCB:s tabeller.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KF_TABLE =
  "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104A/Kfmandat";
const LT_TABLE =
  "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0107/ME0107B/Ltledamoter";

// SCB:s partikoder -> våra förkortningar (FP = Liberalerna).
const PARTY_MAP: Record<string, string> = {
  M: "M",
  C: "C",
  FP: "L",
  KD: "KD",
  MP: "MP",
  S: "S",
  V: "V",
  SD: "SD",
};

// SCB:s regionnamn -> våra region-id:n (historiska landsting utelämnas).
const REGION_ID_BY_NAME: Record<string, string> = {
  "Region Stockholm": "stockholm",
  "Region Uppsala": "uppsala",
  "Region Sörmland": "sormland",
  "Region Östergötland": "ostergotland",
  "Region Jönköpings län": "jonkopings-lan",
  "Region Kronoberg": "kronoberg",
  "Region Kalmar län": "kalmar-lan",
  "Region Blekinge": "blekinge",
  "Region Skåne": "skane",
  "Region Halland": "halland",
  "Västra Götalandsregionen": "vastra-gotaland",
  "Region Värmland": "varmland",
  "Region Örebro län": "orebro-lan",
  "Region Västmanland": "vastmanland",
  "Region Dalarna": "dalarna",
  "Region Gävleborg": "gavleborg",
  "Region Västernorrland": "vasternorrland",
  "Region Jämtland Härjedalen": "jamtland-harjedalen",
  "Region Västerbotten": "vasterbotten",
  "Region Norrbotten": "norrbotten",
};

// Kommunnamn -> kommun-id måste matcha seedens slugifiering. Vi slugifierar
// på samma sätt som seed.ts (importeras därifrån vore cirkulärt, så håll i synk).
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Kommuner vars namn slugifieras lika (Håbo/Habo) — disambiguera via
// SCB:s kommunkod så att id:t matchar seedens databas-id.
const KOMMUN_ID_BY_CODE: Record<string, string> = {
  "0305": "habo", // Håbo, Uppsala län
  "0643": "habo-jonkopings-lan", // Habo, Jönköpings län
};

type PxMeta = {
  variables: { code: string; values: string[]; valueTexts: string[] }[];
};
type PxData = { data: { key: string[]; values: string[] }[] };

async function getMeta(url: string): Promise<PxMeta> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SCB-metadata misslyckades: ${res.status}`);
  return (await res.json()) as PxMeta;
}

async function getData(url: string, query: unknown[]): Promise<PxData> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, response: { format: "json" } }),
  });
  if (!res.ok) throw new Error(`SCB-data misslyckades: ${res.status}`);
  const text = await res.text();
  return JSON.parse(text.trim().replace(/^\uFEFF/, "")) as PxData;
}

async function main() {
  const kfMeta = await getMeta(KF_TABLE);
  const ltMeta = await getMeta(LT_TABLE);

  const latestYear = (meta: PxMeta) => {
    const tid = meta.variables.find((v) => v.code === "Tid");
    if (!tid) throw new Error("Tid-variabel saknas");
    return tid.values[tid.values.length - 1];
  };
  const kfYear = latestYear(kfMeta);
  const ltYear = latestYear(ltMeta);
  console.log(`Senaste valår hos SCB: kommun ${kfYear}, region ${ltYear}`);

  const nameByCode = (meta: PxMeta) => {
    const v = meta.variables.find((x) => x.code === "Region")!;
    return Object.fromEntries(v.values.map((c, i) => [c, v.valueTexts[i]]));
  };
  const kfNames = nameByCode(kfMeta);
  const ltNames = nameByCode(ltMeta);

  const kfData = await getData(KF_TABLE, [
    { code: "Region", selection: { filter: "all", values: ["*"] } },
    { code: "Parti", selection: { filter: "all", values: ["*"] } },
    { code: "Tid", selection: { filter: "item", values: [kfYear] } },
  ]);
  const ltData = await getData(LT_TABLE, [
    { code: "Region", selection: { filter: "all", values: ["*"] } },
    { code: "Parti", selection: { filter: "all", values: ["*"] } },
    { code: "Kon", selection: { filter: "all", values: ["*"] } },
    { code: "Tid", selection: { filter: "item", values: [ltYear] } },
  ]);

  const kommun: Record<string, Record<string, number>> = {};
  const kfByName: Record<string, Record<string, number>> = {};
  for (const row of kfData.data) {
    const [code, parti] = row.key;
    if (code === "00") continue; // riket
    const abbr = PARTY_MAP[parti];
    if (!abbr) continue;
    const name = kfNames[code];
    const seats = parseInt(row.values[0], 10) || 0;
    (kfByName[name] ??= {})[abbr] = seats;
    const id = KOMMUN_ID_BY_CODE[code] ?? slugify(name);
    (kommun[id] ??= {})[abbr] = seats;
  }

  const region: Record<string, Record<string, number>> = {};
  for (const row of ltData.data) {
    const [code, parti] = row.key;
    if (code === "00L") continue; // riket
    const abbr = PARTY_MAP[parti];
    if (!abbr) continue;
    const id = REGION_ID_BY_NAME[ltNames[code]];
    if (!id) continue; // historiska landsting
    const seats = parseInt(row.values[0], 10) || 0;
    (region[id] ??= {})[abbr] = (region[id][abbr] ?? 0) + seats; // summera kön
  }
  // Gotland saknar regionval — regionfullmäktige är kommunfullmäktige.
  if (kfByName["Gotland"]) region["gotland"] = kfByName["Gotland"];

  const outPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "data",
    "mandates.json",
  );
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    JSON.stringify(
      {
        source:
          "SCB Statistikdatabasen (Kfmandat, Ltledamoter), slutligt valresultat",
        electionYear: Number(kfYear),
        fetchedAt: new Date().toISOString().slice(0, 10),
        region,
        kommun,
      },
      null,
      1,
    ),
  );
  console.log(
    `Skrev ${outPath}: ${Object.keys(region).length} regioner, ${Object.keys(kommun).length} kommuner (valår ${kfYear}).`,
  );
  console.log("Kör nu `pnpm run seed` för att läsa in i databasen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
