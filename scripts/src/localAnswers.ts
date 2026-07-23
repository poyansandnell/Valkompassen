/**
 * Redaktionellt bedömda positioner för region- och kommunfrågorna.
 *
 * Riksdagspartiernas lokala föreningar publicerar sällan egna lokala
 * ståndpunkter. Deras svar här är därför bedömda utifrån partiets
 * RIKSPOLITIK och märks med en särskild motivering som förklarar det.
 *
 * Katrineholm FRAMÅT har ett publicerat lokalt program
 * (katrineholmframat.se) — deras svar bygger på det, med null där
 * programmet inte ger besked.
 *
 * Skala: 2 = instämmer helt … -2 = tar helt avstånd, null = oklart.
 * Ordning per rad: index 0 = fråga 1 osv.
 */

import { PARTY_SOURCES } from "./riksdagAnswers";

const P = [
  "socialdemokraterna",
  "moderaterna",
  "sverigedemokraterna",
  "centerpartiet",
  "vansterpartiet",
  "kristdemokraterna",
  "liberalerna",
  "miljopartiet",
] as const;

// reg-1 … reg-25 — kolumner: S, M, SD, C, V, KD, L, MP
const REGION_ROWS: (number | null)[][] = [
  [-1,  2,  1,  2, -2,  2,  2, -1], // 1 vårdgaranti via privata utförare
  [ 1,  2,  1,  2,  1,  2,  1,  1], // 2 kvälls-/helgöppna vårdcentraler
  [ 0, -1,  2,  2,  2,  0, -1,  1], // 3 små sjukhus med dygnet-runt-akut
  [ 1,  0,  2,  2,  2,  1,  0,  1], // 4 förlossning inom en timme
  [ 0,  0,  1,  1,  1,  1,  0,  0], // 5 fler i ambulanssjukvården
  [ 1,  1,  1,  1,  2,  2,  1,  2], // 6 BUP prioriteras
  [ 1, -1,  1,  0,  2,  0, -1,  1], // 7 subventionerad tandvård unga vuxna
  [ 0, -1,  1,  2,  1,  0, -1,  1], // 8 turtäthet landsbygd trots höjt pris
  [ 1, -1,  0,  0,  2,  0, -1,  2], // 9 avgiftsfri kollektivtrafik för unga
  [ 0, -2,  0, -1,  2, -1, -2,  1], // 10 sänkta biljettpriser trots höjd skatt
  [ 1,  2,  1,  2,  0,  2,  2,  0], // 11 stöd till företagsetableringar
  [ 1, -1, -1,  1,  2,  0,  1,  2], // 12 mer pengar till kultur
  [ 1,  0,  0,  1,  2,  1,  1,  2], // 13 förebyggande folkhälsoarbete
  [-2,  2,  0,  2, -2,  1,  2, -2], // 14 fri etablering privata vårdgivare
  [ 1, -2,  0, -1,  2, -1, -2,  1], // 15 höja skatt hellre än skära i vård
  [ 0,  1,  0,  1, -1,  1,  1,  0], // 16 digitala vårdbesök samma ersättning
  [ 1,  0,  0,  1,  2,  1,  1,  1], // 17 avgiftsfria vaccinationer fler grupper
  [ 1,  0,  2,  2,  1,  2,  0,  1], // 18 lokal/svensk sjukhusmat
  [ 1,  1,  2,  1,  2,  1,  1,  1], // 19 högre sjuksköterskelöner
  [ 1,  1,  1,  2,  2,  2,  1,  2], // 20 psykiatrisk öppenvård nära
  [ 2,  2,  1,  1,  2,  2,  1,  1], // 21 minska hyrpersonal
  [ 0,  2,  1,  1, -1,  1,  1, -1], // 22 anropsstyrd trafik
  [ 1, -1,  0,  1,  2,  0,  0,  2], // 23 tåginvesteringar med lån
  [ 1,  0,  2,  0,  2,  1,  0,  0], // 24 fria arbetskläder/parkering personal
  [ 1, -1, -2,  2,  2, -1,  0,  2], // 25 fossilfri region 2030
];

// kh-1 … kh-25 — kolumner: S, M, SD, C, V, KD, L, MP
const KATRINEHOLM_ROWS: (number | null)[][] = [
  [ 2,  1,  1,  1,  2,  1,  2,  1], // 1 ökad grundbemanning i skolan
  [ 0, -1,  2,  2,  1,  1, -1,  1], // 2 bevara landsbygdsskolor
  [ 1, -1,  1,  0,  2,  1, -1,  1], // 3 fler anställda i äldreomsorgen
  [ 1,  0,  2,  0,  1,  2,  0,  0], // 4 äldreboendegaranti 85+
  [ 1,  2,  2,  0, -1,  2,  1, -1], // 5 ordningsvakter i centrum
  [ 1,  2,  2,  1, -1,  2,  1, -1], // 6 fler övervakningskameror
  [ 2,  1,  1,  1,  2,  2,  1,  2], // 7 förebyggande socialtjänst
  [ 2, -1,  0, -1,  2, -1, -1,  1], // 8 kommunala hyresrätter
  [-2,  1,  0,  0, -2,  0,  1, -2], // 9 sänkt kommunalskatt
  [ 0,  1,  2,  0, -1,  1,  0, -2], // 10 avgiftsfri parkering 2 h
  [ 1,  1,  1,  1,  1,  1,  1,  1], // 11 utveckla stadskärnan
  [ 1,  0,  2,  2,  2,  1,  0,  1], // 12 service i kransorterna
  [ 1, -1, -2,  2,  2, -1,  0,  2], // 13 ja till vindkraft på kommunens mark
  [ 0, -1, -1,  0,  1,  0,  0,  2], // 14 fler gågator
  [ 1,  0,  0,  0,  1,  1,  0,  2], // 15 fler farthinder vid skolor
  [ 1,  2,  1,  2,  0,  2,  2,  0], // 16 mark och snabb handläggning företag
  [ 1,  0,  2,  2,  1,  2,  0,  1], // 17 lokala leverantörer i upphandling
  [ 1,  0,  1,  1,  2,  1,  0,  1], // 18 höjda föreningsbidrag
  [ 1, -1,  0,  0,  2,  0,  0,  2], // 19 avgiftsfri kulturskola
  [ 1,  1,  1,  1,  1,  1,  0,  1], // 20 fler idrottsanläggningar
  [ 0,  2,  2,  1,  1,  2,  1,  0], // 21 färre chefer/administratörer
  [ 1,  1,  1,  2,  2,  1,  2,  2], // 22 öppet diarium på webben
  [ 1,  0,  1,  2,  2,  1,  1,  2], // 23 medborgarförslag
  [ 1,  0,  1,  2,  2,  1,  1,  2], // 24 fler medborgardialoger
  [ 0,  2,  2, -1, -2,  1,  0, -2], // 25 färre nyanlända för bosättning
];

// kom-frågorna är en generisk delmängd av Katrineholmsfrågorna.
// Mappning: kom-index → kh-radnummer (1-baserat).
const KOM_FROM_KH = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 22, 23];

function toRecord(rows: (number | null)[][]): Record<string, (number | null)[]> {
  const out: Record<string, (number | null)[]> = {};
  P.forEach((partyId, col) => {
    out[partyId] = rows.map((row) => row[col] ?? null);
  });
  return out;
}

export const REGION_POSITIONS = toRecord(REGION_ROWS);
export const KATRINEHOLM_POSITIONS = toRecord(KATRINEHOLM_ROWS);
export const GENERIC_KOMMUN_POSITIONS = toRecord(
  KOM_FROM_KH.map((n) => KATRINEHOLM_ROWS[n - 1]!),
);

// Katrineholm FRAMÅT — riktiga lokala ståndpunkter från partiets program
// (katrineholmframat.se, läst juli 2026). null = programmet ger inte besked.
export const KF_KATRINEHOLM: (number | null)[] = [
  2,    // 1 grundbemanning skolan — "fler vuxna i skolan"
  null, // 2 landsbygdsskolor
  1,    // 3 äldreomsorg — stora pensionärssatsningar
  null, // 4 äldreboendegaranti
  2,    // 5 ordningsvakter — "ökad närvaro av vuxna och ordningsvakter"
  2,    // 6 kameror — "trygghetszoner med kameraövervakning"
  1,    // 7 förebyggande — satsningar på ungdomsgårdar
  null, // 8 kommunala hyresrätter
  null, // 9 sänkt kommunalskatt — betonar klok användning, inte nivån
  null, // 10 parkering
  1,    // 11 stadskärnan — tryggare centrum, ungdomsgårdar i centrum
  null, // 12 kransorter
  -2,   // 13 vindkraft — folkinitiativ MOT vindkraft vid Ramsjöhult
  null, // 14 gågator
  -1,   // 15 farthinder — "bort med onödiga farthinder"
  2,    // 16 företagsetableringar — fler jobb stärker ekonomin
  null, // 17 upphandling
  2,    // 18 föreningsbidrag — "ökade anslag till föreningar"
  1,    // 19 kulturskola — sänkta kostnader för idrott och kultur
  1,    // 20 idrottsanläggningar — stöd till ungdomsidrott
  1,    // 21 färre chefer — respekt för skattepengar, inga prestigeprojekt
  2,    // 22 öppet diarium — "offentlig insyn i beslut"
  2,    // 23 medborgarförslag — egen medborgarförslagsfunktion
  2,    // 24 medborgardialoger — "verklig dialog med invånarna"
  null, // 25 nyanlända
];

export const KF_SOURCE = {
  title: "Katrineholm FRAMÅT – partiets program",
  url: "https://www.katrineholmframat.se",
};

export const KF_JUSTIFICATION =
  "Redaktionell bedömning utifrån Katrineholm FRAMÅT:s publicerade program. Partiet har ännu inte själv bekräftat svaret.";

export const FALLBACK_JUSTIFICATION =
  "Partiets lokala förening har inte publicerat egna lokala ståndpunkter. Svaret är en redaktionell bedömning utifrån partiets rikspolitik.";

export { PARTY_SOURCES };
