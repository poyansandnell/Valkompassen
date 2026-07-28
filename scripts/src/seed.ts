/**
 * Seed script for Valkompass.
 *
 * Riksdag answers are REAL editorial assessments sourced from the parties'
 * official policy pages (see ./riksdagAnswers.ts) — origin "editorial",
 * never presented as party-submitted. Region and kommun answers are also
 * editorial (with riks-fallback where local positions are unpublished).
 * Fullmäktige mandates for all regions/kommuner come from SCB via
 * `pnpm run update-mandates` (writes ./data/mandates.json).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  db,
  pool,
  municipalitiesTable,
  partiesTable,
  partyAnswersTable,
  partyParticipationTable,
  questionsTable,
  regionsTable,
} from "@workspace/db";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mandatfördelning i region-/kommunfullmäktige från SCB (senaste valet).
// Uppdateras efter varje val med `pnpm run update-mandates`.
const MANDATES: {
  electionYear: number;
  region: Record<string, Record<string, number>>;
  kommun: Record<string, Record<string, number>>;
} = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "data", "mandates.json"),
    "utf8",
  ),
);

// ---------------------------------------------------------------- geography

const REGIONS: { name: string; municipalities: string[] }[] = [
  {
    name: "Region Stockholm",
    municipalities: [
      "Botkyrka", "Danderyd", "Ekerö", "Haninge", "Huddinge", "Järfälla",
      "Lidingö", "Nacka", "Norrtälje", "Nykvarn", "Nynäshamn", "Salem",
      "Sigtuna", "Sollentuna", "Solna", "Stockholm", "Sundbyberg",
      "Södertälje", "Tyresö", "Täby", "Upplands Väsby", "Upplands-Bro",
      "Vallentuna", "Vaxholm", "Värmdö", "Österåker",
    ],
  },
  {
    name: "Region Uppsala",
    municipalities: [
      "Enköping", "Heby", "Håbo", "Knivsta", "Tierp", "Uppsala",
      "Älvkarleby", "Östhammar",
    ],
  },
  {
    name: "Region Sörmland",
    municipalities: [
      "Eskilstuna", "Flen", "Gnesta", "Katrineholm", "Nyköping",
      "Oxelösund", "Strängnäs", "Trosa", "Vingåker",
    ],
  },
  {
    name: "Region Östergötland",
    municipalities: [
      "Boxholm", "Finspång", "Kinda", "Linköping", "Mjölby", "Motala",
      "Norrköping", "Söderköping", "Vadstena", "Valdemarsvik", "Ydre",
      "Åtvidaberg", "Ödeshög",
    ],
  },
  {
    name: "Region Jönköpings län",
    municipalities: [
      "Aneby", "Eksjö", "Gislaved", "Gnosjö", "Habo", "Jönköping",
      "Mullsjö", "Nässjö", "Sävsjö", "Tranås", "Vaggeryd", "Vetlanda",
      "Värnamo",
    ],
  },
  {
    name: "Region Kronoberg",
    municipalities: [
      "Alvesta", "Lessebo", "Ljungby", "Markaryd", "Tingsryd",
      "Uppvidinge", "Växjö", "Älmhult",
    ],
  },
  {
    name: "Region Kalmar län",
    municipalities: [
      "Borgholm", "Emmaboda", "Hultsfred", "Högsby", "Kalmar", "Mönsterås",
      "Mörbylånga", "Nybro", "Oskarshamn", "Torsås", "Vimmerby", "Västervik",
    ],
  },
  { name: "Region Gotland", municipalities: ["Gotland"] },
  {
    name: "Region Blekinge",
    municipalities: [
      "Karlshamn", "Karlskrona", "Olofström", "Ronneby", "Sölvesborg",
    ],
  },
  {
    name: "Region Skåne",
    municipalities: [
      "Bjuv", "Bromölla", "Burlöv", "Båstad", "Eslöv", "Helsingborg",
      "Hässleholm", "Höganäs", "Hörby", "Höör", "Klippan", "Kristianstad",
      "Kävlinge", "Landskrona", "Lomma", "Lund", "Malmö", "Osby",
      "Perstorp", "Simrishamn", "Sjöbo", "Skurup", "Staffanstorp",
      "Svalöv", "Svedala", "Tomelilla", "Trelleborg", "Vellinge", "Ystad",
      "Åstorp", "Ängelholm", "Örkelljunga", "Östra Göinge",
    ],
  },
  {
    name: "Region Halland",
    municipalities: [
      "Falkenberg", "Halmstad", "Hylte", "Kungsbacka", "Laholm", "Varberg",
    ],
  },
  {
    name: "Västra Götalandsregionen",
    municipalities: [
      "Ale", "Alingsås", "Bengtsfors", "Bollebygd", "Borås", "Dals-Ed",
      "Essunga", "Falköping", "Färgelanda", "Grästorp", "Gullspång",
      "Göteborg", "Götene", "Herrljunga", "Hjo", "Härryda", "Karlsborg",
      "Kungälv", "Lerum", "Lidköping", "Lilla Edet", "Lysekil",
      "Mariestad", "Mark", "Mellerud", "Munkedal", "Mölndal", "Orust",
      "Partille", "Skara", "Skövde", "Sotenäs", "Stenungsund",
      "Strömstad", "Svenljunga", "Tanum", "Tibro", "Tidaholm", "Tjörn",
      "Tranemo", "Trollhättan", "Töreboda", "Uddevalla", "Ulricehamn",
      "Vara", "Vårgårda", "Vänersborg", "Åmål", "Öckerö",
    ],
  },
  {
    name: "Region Värmland",
    municipalities: [
      "Arvika", "Eda", "Filipstad", "Forshaga", "Grums", "Hagfors",
      "Hammarö", "Karlstad", "Kil", "Kristinehamn", "Munkfors",
      "Storfors", "Sunne", "Säffle", "Torsby", "Årjäng",
    ],
  },
  {
    name: "Region Örebro län",
    municipalities: [
      "Askersund", "Degerfors", "Hallsberg", "Hällefors", "Karlskoga",
      "Kumla", "Laxå", "Lekeberg", "Lindesberg", "Ljusnarsberg", "Nora",
      "Örebro",
    ],
  },
  {
    name: "Region Västmanland",
    municipalities: [
      "Arboga", "Fagersta", "Hallstahammar", "Kungsör", "Köping",
      "Norberg", "Sala", "Skinnskatteberg", "Surahammar", "Västerås",
    ],
  },
  {
    name: "Region Dalarna",
    municipalities: [
      "Avesta", "Borlänge", "Falun", "Gagnef", "Hedemora", "Leksand",
      "Ludvika", "Malung-Sälen", "Mora", "Orsa", "Rättvik",
      "Smedjebacken", "Säter", "Vansbro", "Älvdalen",
    ],
  },
  {
    name: "Region Gävleborg",
    municipalities: [
      "Bollnäs", "Gävle", "Hofors", "Hudiksvall", "Ljusdal", "Nordanstig",
      "Ockelbo", "Ovanåker", "Sandviken", "Söderhamn",
    ],
  },
  {
    name: "Region Västernorrland",
    municipalities: [
      "Härnösand", "Kramfors", "Sollefteå", "Sundsvall", "Timrå", "Ånge",
      "Örnsköldsvik",
    ],
  },
  {
    name: "Region Jämtland Härjedalen",
    municipalities: [
      "Berg", "Bräcke", "Härjedalen", "Krokom", "Ragunda", "Strömsund",
      "Åre", "Östersund",
    ],
  },
  {
    name: "Region Västerbotten",
    municipalities: [
      "Bjurholm", "Dorotea", "Lycksele", "Malå", "Nordmaling", "Norsjö",
      "Robertsfors", "Skellefteå", "Sorsele", "Storuman", "Umeå",
      "Vilhelmina", "Vindeln", "Vännäs", "Åsele",
    ],
  },
  {
    name: "Region Norrbotten",
    municipalities: [
      "Arjeplog", "Arvidsjaur", "Boden", "Gällivare", "Haparanda",
      "Jokkmokk", "Kalix", "Kiruna", "Luleå", "Pajala", "Piteå",
      "Älvsbyn", "Överkalix", "Övertorneå",
    ],
  },
];

// ------------------------------------------------------------------ parties

type PartySeed = {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  description: string;
  website: string | null;
};

const NATIONAL_PARTIES: PartySeed[] = [
  { id: "socialdemokraterna", name: "Socialdemokraterna", abbreviation: "S", color: "#E8112d", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://www.socialdemokraterna.se" },
  { id: "moderaterna", name: "Moderaterna", abbreviation: "M", color: "#52BDEC", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://moderaterna.se" },
  { id: "sverigedemokraterna", name: "Sverigedemokraterna", abbreviation: "SD", color: "#DDDD00", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://sd.se" },
  { id: "centerpartiet", name: "Centerpartiet", abbreviation: "C", color: "#009933", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://www.centerpartiet.se" },
  { id: "vansterpartiet", name: "Vänsterpartiet", abbreviation: "V", color: "#DA291C", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://www.vansterpartiet.se" },
  { id: "kristdemokraterna", name: "Kristdemokraterna", abbreviation: "KD", color: "#000077", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://kristdemokraterna.se" },
  { id: "liberalerna", name: "Liberalerna", abbreviation: "L", color: "#006AB3", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://www.liberalerna.se" },
  { id: "miljopartiet", name: "Miljöpartiet de gröna", abbreviation: "MP", color: "#83CF39", description: "Riksdagsparti. Svaren på riksdagsfrågorna är redaktionellt bedömda utifrån partiets officiella program.", website: "https://www.mp.se" },
];

const LOCAL_PARTIES: PartySeed[] = [
  {
    id: "medborgerlig-samling",
    name: "Medborgerlig Samling",
    abbreviation: "MED",
    color: "#1B3A5C",
    description:
      "Parti utanför riksdagen som ställer upp i riksdagsvalet. Svaren är redaktionellt bedömda utifrån partiets officiella program och delvis ofullständiga.",
    website: "https://www.med.se",
  },
  {
    id: "katrineholm-framat",
    name: "Katrineholm FRAMÅT",
    abbreviation: "KF",
    color: "#FF8B01",
    description:
      "Lokalt parti i Katrineholm. Svaren är redaktionellt bedömda utifrån partiets publicerade program.",
    website: "https://www.katrineholmframat.se",
  },
  {
    id: "sormlandslistan",
    name: "Sörmlandslistan",
    abbreviation: "SL",
    color: "#0D9488",
    description:
      "Regionalt parti som ställer upp i regionvalet i Sörmland. Partiet har ingen publicerad politik att bedöma och har ännu inte lämnat egna svar.",
    website: null,
  },
];

// Urvalskriterium riksdagsnivån: partier utanför riksdagen tas med om de fick
// minst 0,1 % av rösterna i senaste riksdagsvalet (Valmyndighetens slutresultat
// 2022: Nyans 0,44 %, AfS 0,26 %, MED 0,20 %, Piratpartiet 0,14 %).
// De visas som "har inte lämnat svar" tills svar bedömts (MED har bedömda svar).
const RIKSDAG_MINOR_PARTIES: PartySeed[] = [
  {
    id: "partiet-nyans",
    name: "Partiet Nyans",
    abbreviation: "NYANS",
    color: "#2AA9B7",
    description:
      "Parti utanför riksdagen (0,44 % i riksdagsvalet 2022). Svaren är redaktionellt bedömda utifrån partiets officiella program och delvis ofullständiga.",
    website: "https://partietnyans.se",
  },
  {
    id: "alternativ-for-sverige",
    name: "Alternativ för Sverige",
    abbreviation: "AFS",
    color: "#104E8B",
    description:
      "Parti utanför riksdagen (0,26 % i riksdagsvalet 2022). Svaren är redaktionellt bedömda utifrån partiets officiella program och delvis ofullständiga.",
    website: "https://alternativforsverige.se",
  },
  {
    id: "piratpartiet",
    name: "Piratpartiet",
    abbreviation: "PP",
    color: "#572B85",
    description:
      "Parti utanför riksdagen (0,14 % i riksdagsvalet 2022). Partiets program tar bara ställning i ett fåtal av frågorna; de svar som finns är redaktionellt bedömda utifrån partiets officiella program.",
    website: "https://piratpartiet.se",
  },
];

// Alla lokala partier med fullmäktigemandat 2022 (Valmyndighetens
// mandatfördelningsfil) — visas i sin kommun/region som "har inte lämnat svar".
const LOCAL_PARTY_DATA: {
  electionYear: number;
  parties: { id: string; name: string; abbreviation: string }[];
  region: Record<string, { partyId: string; seats: number }[]>;
  kommun: Record<string, { partyId: string; seats: number }[]>;
} = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "data", "localParties.json"),
    "utf8",
  ),
);

// Redaktionell research om de lokala partierna: hemsida, kort beskrivning
// och (där partiets publicerade material ger besked) bedömda svar på de
// generiska kommunfrågorna. Bedömningarna är strikta — null där materialet
// inte ger tydligt besked. Genererad juli 2026 från partiernas webbplatser.
const LOCAL_PARTY_RESEARCH: {
  assessedAt: string;
  questionFingerprint: { first: string; last: string; count: number };
  parties: Record<
    string,
    {
      website: string | null;
      description: string | null;
      answers: (number | null)[] | null;
      sources: string[];
    }
  >;
} = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "data", "localPartyResearch.json"),
    "utf8",
  ),
);

const LOCAL_RESEARCH_JUSTIFICATION =
  "Redaktionell bedömning utifrån partiets eget publicerade material (partiets webbplats), juli 2026. Där materialet inte ger tydligt besked har partiet inget bedömt svar.";

// ---------------------------------------------------------------- questions

// [text, category, explanation]
type QuestionSeed = [string, string, string];

import {
  EDITORIAL_JUSTIFICATION,
  PARTY_SOURCES,
  RIKSDAG_POSITIONS,
} from "./riksdagAnswers";
import {
  FALLBACK_JUSTIFICATION,
  GENERIC_KOMMUN_POSITIONS,
  KATRINEHOLM_POSITIONS,
  KF_JUSTIFICATION,
  KF_KATRINEHOLM,
  KF_SOURCE,
  REGION_POSITIONS,
} from "./localAnswers";

const RIKSDAG_QUESTIONS: QuestionSeed[] = [
  ["Statens inkomstskatt bör sänkas, även om det innebär mindre resurser till offentlig sektor.", "Ekonomi och skatt", "Frågan handlar om avvägningen mellan lägre skatt på arbete och finansiering av gemensam välfärd."],
  ["Staten bör göra det enklare och billigare att anställa unga och långtidsarbetslösa.", "Jobb", "Förslag om exempelvis sänkta arbetsgivaravgifter för vissa grupper."],
  ["Reglerna för småföretag bör förenklas kraftigt, även om viss kontroll minskar.", "Företagande", "Handlar om regelbördan för mindre företag."],
  ["Staten bör ta över huvudansvaret för sjukvården från regionerna.", "Sjukvård", "Idag ansvarar regionerna för det mesta av vården. Frågan gäller ett förstatligande."],
  ["Vinstuttag från friskolor bör begränsas.", "Skola", "Frågan gäller om skolföretag ska kunna dela ut vinst till ägarna."],
  ["Staten bör återta huvudmannaskapet för skolan från kommunerna.", "Skola", "Frågan gäller vem som ska styra skolan."],
  ["Straffen för grova våldsbrott bör skärpas ytterligare.", "Kriminalitet", "Handlar om straffnivåer för de allvarligaste brotten."],
  ["Polisen bör få utökade möjligheter till kameraövervakning på allmän plats.", "Kriminalitet", "En avvägning mellan brottsbekämpning och personlig integritet."],
  ["Sverige bör ta emot färre asylsökande än idag.", "Migration", "Frågan gäller nivån på asylmottagandet."],
  ["Kraven för svenskt medborgarskap bör skärpas, till exempel med språkkrav.", "Integration", "Handlar om vilka krav som ska ställas för medborgarskap."],
  ["Ny kärnkraft bör byggas i Sverige.", "Kärnkraft", "Frågan gäller om staten aktivt ska möjliggöra och stödja ny kärnkraft."],
  ["Utbyggnaden av vindkraft bör påskyndas, även om det påverkar lokala miljöer.", "Vindkraft", "En avvägning mellan energiproduktion och lokal påverkan."],
  ["Sverige bör ha högre klimatmål än EU kräver.", "Klimat", "Frågan gäller ambitionsnivån i den nationella klimatpolitiken."],
  ["Bensin- och dieselskatten bör sänkas.", "Klimat", "En avvägning mellan hushållens kostnader och klimatstyrning."],
  ["Försvarsanslagen bör öka ytterligare utöver dagens nivå.", "Försvar", "Handlar om hur mycket av statens budget som ska gå till försvaret."],
  ["Sveriges medlemskap i NATO stärker landets säkerhet.", "NATO", "Frågan gäller synen på alliansmedlemskapets betydelse."],
  ["Garantipensionen bör höjas, även om det kräver högre skatter.", "Pensioner", "Handlar om nivån på pensionen för dem med lägst pension."],
  ["Det bör bli enklare att bygga bostäder genom färre överklagandemöjligheter.", "Bostäder", "En avvägning mellan byggtakt och möjligheten att påverka sin närmiljö."],
  ["Hyresregleringen bör behållas i sin nuvarande form.", "Bostäder", "Frågan gäller systemet med förhandlade hyror."],
  ["Staten bör göra mer för att hela landet ska leva, även om det kostar mer.", "Landsbygd", "Handlar om service, infrastruktur och jobb utanför storstäderna."],
  ["Reseavdraget bör gynna dem som är beroende av bil på landsbygden.", "Landsbygd", "Frågan gäller utformningen av reseavdraget."],
  ["Sverige bör verka för att EU får mer makt över medlemsländernas politik.", "EU", "En avvägning mellan europeiskt samarbete och nationellt självbestämmande."],
  ["Privata företag bör kunna driva sjukhus och vårdcentraler med vinst.", "Välfärd", "Frågan gäller vinstdrivande företag i skattefinansierad vård."],
  ["Arbetslöshetsförsäkringen (a-kassan) bör ge högre ersättning.", "Välfärd", "Handlar om nivån på ersättningen vid arbetslöshet."],
  ["Staten bör begränsa myndigheters möjlighet att samla in personuppgifter om medborgare.", "Personlig integritet", "En avvägning mellan effektiv förvaltning, brottsbekämpning och integritet."],
  ["Anonyma vittnen bör tillåtas i rättegångar om grov brottslighet.", "Kriminalitet", "En avvägning mellan rättssäkerhet och skydd av vittnen."],
  ["Marginalskatten på höga inkomster bör höjas.", "Ekonomi och skatt", "Frågan gäller skatt på de högsta inkomsterna."],
  ["Elstödet bör i första hand gå till hushåll med små marginaler.", "Energi", "Handlar om hur stöd vid höga elpriser ska fördelas."],
  ["Arbetskraftsinvandring bör begränsas till bristyrken.", "Migration", "Frågan gäller regler för arbetstillstånd."],
  ["Skolan bör förbjuda mobiltelefoner under lektionstid i hela landet.", "Skola", "Frågan gäller nationella regler för mobiler i skolan."],
];

const REGION_QUESTIONS: QuestionSeed[] = [
  ["Regionen bör garantera vårdbesök inom vårdgarantins tidsgränser, även om det kräver att vård köps från privata utförare.", "Vårdköer", "Handlar om hur vårdköerna ska kortas."],
  ["Fler vårdcentraler bör ha öppet på kvällar och helger.", "Vårdcentraler", "Frågan gäller tillgängligheten i primärvården."],
  ["Mindre sjukhus i regionen bör behålla akutverksamhet dygnet runt, även om det kostar mer.", "Sjukhus", "En avvägning mellan närhet till akutvård och resurseffektivitet."],
  ["Förlossningsvården bör förstärkas så att ingen ska behöva åka mer än en timme till förlossning.", "Förlossningsvård", "Handlar om tillgången till förlossningsvård i hela regionen."],
  ["Regionen bör anställa fler i ambulanssjukvården, även om annan vård då får mindre resurser.", "Ambulanssjukvård", "En prioriteringsfråga inom vårdbudgeten."],
  ["Barn- och ungdomspsykiatrin (BUP) bör prioriteras framför annan vård tills köerna är borta.", "Psykiatri", "Handlar om prioritering av psykiatri för unga."],
  ["Regionen bör erbjuda subventionerad tandvård för fler unga vuxna.", "Tandvård", "Frågan gäller upp till vilken ålder tandvård ska subventioneras."],
  ["Kollektivtrafikens turtäthet bör öka på landsbygden, även om biljettpriserna då höjs.", "Kollektivtrafik", "En avvägning mellan utbud och pris."],
  ["Kollektivtrafiken bör vara avgiftsfri för barn och ungdomar.", "Biljettpriser", "Frågan gäller subventionerade resor för unga."],
  ["Priset på enkelbiljetter bör sänkas, även om det kräver högre regionskatt.", "Biljettpriser", "En avvägning mellan biljettpris och skatt."],
  ["Regionen bör aktivt stödja företagsetableringar med mark och snabb handläggning.", "Regional utveckling", "Handlar om regionens roll i näringslivsutvecklingen."],
  ["Regionen bör lägga mer pengar på kultur, till exempel teater, musik och museer.", "Kultur", "En prioriteringsfråga i regionbudgeten."],
  ["Regionen bör satsa mer på förebyggande folkhälsoarbete, även om det tar resurser från vården på kort sikt.", "Folkhälsa", "Handlar om balansen mellan förebyggande arbete och sjukvård."],
  ["Privata vårdgivare bör få etablera sig fritt i regionen med offentlig ersättning.", "Vårdcentraler", "Frågan gäller etableringsfrihet i primärvården."],
  ["Regionen bör höja skatten hellre än att skära ner på vården.", "Vårdköer", "En avvägning mellan skattenivå och vårdens omfattning."],
  ["Digitala vårdbesök bör ersättas på samma villkor som fysiska besök.", "Vårdcentraler", "Handlar om villkoren för digital vård."],
  ["Regionen bör erbjuda vaccinationer utan avgift för fler grupper.", "Folkhälsa", "Frågan gäller avgiftsfria vaccinationer."],
  ["Sjukhusmaten bör i högre grad lagas lokalt och med svenska råvaror, även om kostnaden ökar.", "Sjukhus", "En fråga om upphandling och kvalitet."],
  ["Regionen bör betala högre löner till sjuksköterskor för att klara bemanningen, även om det innebär besparingar på annat.", "Sjukhus", "Handlar om kompetensförsörjning i vården."],
  ["Psykiatrin bör byggas ut med fler öppenvårdsmottagningar nära patienterna.", "Psykiatri", "Frågan gäller psykiatrins organisation."],
  ["Regionen bör kraftigt minska användningen av hyrpersonal i vården, även om det tillfälligt ger färre öppna vårdplatser.", "Sjukhus", "En avvägning mellan kostnadskontroll och kapacitet."],
  ["Busslinjer med få resenärer bör ersättas med anropsstyrd trafik.", "Kollektivtrafik", "Handlar om trafik på landsbygden."],
  ["Regionen bör investera i nya tågförbindelser även om det innebär lånefinansiering.", "Kollektivtrafik", "En avvägning mellan investeringar och ekonomi."],
  ["Vårdpersonal bör erbjudas arbetskläder och parkering utan kostnad.", "Sjukhus", "En fråga om personalvillkor."],
  ["Regionen bör ha som mål att bli fossilfri till 2030.", "Regional utveckling", "Frågan gäller regionens klimatarbete."],
];

const KATRINEHOLM_QUESTIONS: QuestionSeed[] = [
  ["Katrineholms kommun bör öka grundbemanningen i skolan, även om det kräver besparingar på annat.", "Skola", "En prioriteringsfråga i kommunens budget."],
  ["Landsbygdsskolorna i kommunen bör bevaras, även om elevunderlaget minskar.", "Skola", "Handlar om skolstrukturen utanför tätorten."],
  ["Äldreomsorgen bör bemannas med fler anställda per boende, även om kommunalskatten då höjs.", "Äldreomsorg", "En avvägning mellan kvalitet i omsorgen och skattenivå."],
  ["Kommunen bör garantera plats på äldreboende inom tre månader för alla över 85 år.", "Äldreomsorg", "Frågan gäller en lokal äldreboendegaranti."],
  ["Kommunen bör anlita ordningsvakter i Katrineholms centrum.", "Trygghet", "Handlar om trygghetsskapande åtgärder i centrum."],
  ["Fler övervakningskameror bör sättas upp på otrygga platser i kommunen.", "Trygghet", "En avvägning mellan trygghet och personlig integritet."],
  ["Socialtjänsten bör få mer resurser till förebyggande arbete med barn och unga.", "Socialtjänst", "Handlar om tidiga insatser."],
  ["Kommunen bör bygga fler hyresrätter genom det kommunala bostadsbolaget.", "Bostäder", "Frågan gäller kommunens roll i bostadsbyggandet."],
  ["Kommunalskatten i Katrineholm bör sänkas, även om det innebär minskad kommunal service.", "Kommunalskatt", "En avvägning mellan skattenivå och service."],
  ["Parkering i Katrineholms centrum bör vara avgiftsfri de första två timmarna.", "Parkering", "Handlar om parkeringsavgifter i centrum."],
  ["Kommunen bör satsa mer på att utveckla stadskärnan, även om det kostar.", "Centrumutveckling", "Frågan gäller investeringar i centrummiljön."],
  ["Kommunal service, som bibliotek och medborgarkontor, bör finnas kvar i kransorterna.", "Kransorter", "Handlar om service i exempelvis Valla, Sköldinge och Björkvik."],
  ["Kommunen bör säga ja till ny vindkraft på kommunens mark.", "Vindkraft", "Frågan gäller det kommunala vetot vid vindkraftsetableringar."],
  ["Fler gator i centrala Katrineholm bör bli gågator eller gångfartsområden.", "Trafik", "Handlar om trafikmiljön i centrum."],
  ["Kommunen bör bygga fler farthinder vid skolor och förskolor.", "Fartgupp", "En fråga om trafiksäkerhet."],
  ["Kommunen bör aktivt erbjuda mark och snabb handläggning för företag som vill etablera sig.", "Näringsliv", "Handlar om kommunens näringslivspolitik."],
  ["Kommunens upphandlingar bör prioritera lokala leverantörer och svenska råvaror, även om det blir dyrare.", "Upphandlingar", "En avvägning mellan pris och andra värden i upphandling."],
  ["Föreningsbidragen bör höjas, även om det kräver besparingar på annat.", "Föreningsliv", "Handlar om stödet till det lokala föreningslivet."],
  ["Kommunen bör satsa mer på kulturskolan så att fler barn kan delta utan avgift.", "Kultur", "Frågan gäller avgifter och utbud i kulturskolan."],
  ["Kommunen bör investera i fler idrottsanläggningar och spontanidrottsplatser.", "Fritid", "En prioriteringsfråga för fritidsutbudet."],
  ["Antalet chefer och administratörer i kommunen bör minskas till förmån för personal i välfärdens kärna.", "Kommunal organisation", "Handlar om kommunens organisation."],
  ["Kommunens beslutsunderlag och diarium bör publiceras öppet på webben.", "Transparens", "Frågan gäller öppenhet i den kommunala förvaltningen."],
  ["Medborgarna bör kunna väcka förslag som fullmäktige måste behandla (medborgarförslag).", "Demokrati", "Handlar om formerna för lokalt inflytande."],
  ["Kommunen bör ordna fler medborgardialoger innan större beslut fattas.", "Demokrati", "Frågan gäller dialog med invånarna."],
  ["Kommunen bör ta emot färre nyanlända för bosättning än idag.", "Integration", "Handlar om kommunens mottagande av nyanlända."],
];

const GENERIC_KOMMUN_QUESTIONS: QuestionSeed[] = [
  ["Kommunen bör öka grundbemanningen i skolan, även om det kräver besparingar på annat.", "Skola", "En prioriteringsfråga i kommunens budget."],
  ["Mindre skolor på landsbygden bör bevaras, även om elevunderlaget minskar.", "Skola", "Handlar om skolstrukturen i kommunen."],
  ["Äldreomsorgen bör bemannas med fler anställda per boende, även om kommunalskatten då höjs.", "Äldreomsorg", "En avvägning mellan kvalitet i omsorgen och skattenivå."],
  ["Kommunen bör anlita ordningsvakter i centrum.", "Trygghet", "Handlar om trygghetsskapande åtgärder."],
  ["Fler övervakningskameror bör sättas upp på otrygga platser i kommunen.", "Trygghet", "En avvägning mellan trygghet och personlig integritet."],
  ["Socialtjänsten bör få mer resurser till förebyggande arbete med barn och unga.", "Socialtjänst", "Handlar om tidiga insatser."],
  ["Kommunen bör bygga fler hyresrätter genom det kommunala bostadsbolaget.", "Bostäder", "Frågan gäller kommunens roll i bostadsbyggandet."],
  ["Kommunalskatten bör sänkas, även om det innebär minskad kommunal service.", "Kommunalskatt", "En avvägning mellan skattenivå och service."],
  ["Parkering i centrum bör vara avgiftsfri de första timmarna.", "Parkering", "Handlar om parkeringsavgifter."],
  ["Kommunen bör satsa mer på att utveckla centrum, även om det kostar.", "Centrumutveckling", "Frågan gäller investeringar i centrummiljön."],
  ["Kommunal service bör finnas kvar i kommunens mindre orter.", "Kransorter", "Handlar om service utanför centralorten."],
  ["Kommunen bör säga ja till ny vindkraft på kommunens mark.", "Vindkraft", "Frågan gäller det kommunala vetot vid vindkraftsetableringar."],
  ["Kommunen bör bygga fler farthinder vid skolor och förskolor.", "Trafik", "En fråga om trafiksäkerhet."],
  ["Kommunen bör aktivt erbjuda mark och snabb handläggning för företag som vill etablera sig.", "Näringsliv", "Handlar om kommunens näringslivspolitik."],
  ["Kommunens upphandlingar bör prioritera lokala leverantörer, även om det blir dyrare.", "Upphandlingar", "En avvägning i upphandlingspolitiken."],
  ["Föreningsbidragen bör höjas, även om det kräver besparingar på annat.", "Föreningsliv", "Handlar om stödet till föreningslivet."],
  ["Kulturskolan bör vara avgiftsfri för alla barn.", "Kultur", "Frågan gäller avgifter i kulturskolan."],
  ["Kommunen bör investera i fler idrottsanläggningar.", "Fritid", "En prioriteringsfråga för fritidsutbudet."],
  ["Kommunens beslutsunderlag bör publiceras öppet på webben.", "Transparens", "Frågan gäller öppenhet i förvaltningen."],
  ["Medborgarna bör kunna väcka förslag som fullmäktige måste behandla.", "Demokrati", "Handlar om formerna för lokalt inflytande."],
];

async function main() {
  console.log("Clearing existing seed data...");
  await db.delete(partyAnswersTable);
  await db.delete(questionsTable);
  await db.delete(partyParticipationTable);
  await db.delete(partiesTable);
  await db.delete(municipalitiesTable);
  await db.delete(regionsTable);

  console.log("Seeding regions and municipalities...");
  const usedMunicipalitySlugs = new Set<string>();
  for (const region of REGIONS) {
    const regionId = slugify(region.name.replace(/^(Region |Västra Götalandsregionen)/, (m) => m === "Västra Götalandsregionen" ? "Västra Götaland" : ""));
    await db.insert(regionsTable).values({
      id: regionId || slugify(region.name),
      name: region.name,
      slug: regionId || slugify(region.name),
    });
    await db.insert(municipalitiesTable).values(
      region.municipalities.map((name) => {
        // Håbo/Habo etc. collide after slugification — disambiguate.
        let slug = slugify(name);
        if (usedMunicipalitySlugs.has(slug)) {
          slug = `${slug}-${regionId || slugify(region.name)}`;
        }
        usedMunicipalitySlugs.add(slug);
        return {
          id: slug,
          name,
          slug,
          regionId: regionId || slugify(region.name),
        };
      }),
    );
  }

  console.log("Seeding parties...");
  // Lokala partier från Valmyndighetens data — hoppa över id:n som redan
  // finns manuellt inlagda (t.ex. Medborgerlig Samling).
  const manualIds = new Set(
    [...NATIONAL_PARTIES, ...LOCAL_PARTIES, ...RIKSDAG_MINOR_PARTIES].map((p) => p.id),
  );
  const dataLocalParties: PartySeed[] = LOCAL_PARTY_DATA.parties
    .filter((p) => !manualIds.has(p.id))
    .map((p) => {
      const research = LOCAL_PARTY_RESEARCH.parties[p.id];
      return {
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation,
        color: "#64748b",
        description:
          research?.description ??
          "Lokalt parti med mandat i fullmäktige. Partiet har ännu inte lämnat eller fått bedömda svar i valkompassen.",
        website: research?.website ?? null,
      };
    });
  const allParties = [
    ...NATIONAL_PARTIES,
    ...LOCAL_PARTIES,
    ...RIKSDAG_MINOR_PARTIES,
    ...dataLocalParties,
  ];
  await db.insert(partiesTable).values(
    allParties.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.id,
      abbreviation: p.abbreviation,
      color: p.color,
      description: p.description,
      website: p.website,
      // Alla svar är nu riktiga redaktionella bedömningar (eller saknas
      // helt, som för Sörmlandslistan) — ingen testdata längre.
      isTestData: false,
    })),
  );

  console.log("Seeding party participation...");
  const participation: {
    partyId: string;
    level: string;
    regionId?: string | null;
    municipalityId?: string | null;
    inAssembly?: boolean;
  }[] = [];
  // Riksdag: riksdagspartierna sitter i riksdagen.
  for (const p of NATIONAL_PARTIES) {
    participation.push({ partyId: p.id, level: "riksdag", inAssembly: true });
  }
  // MED ställer upp nationellt men saknar riksdagsmandat.
  participation.push({
    partyId: "medborgerlig-samling",
    level: "riksdag",
    inAssembly: false,
  });
  // Övriga partier över 0,1 %-gränsen i riksdagsvalet 2022.
  for (const p of RIKSDAG_MINOR_PARTIES) {
    participation.push({ partyId: p.id, level: "riksdag", inAssembly: false });
  }

  // Region- och kommunfullmäktige: mandatdata från SCB (senaste valet),
  // uppdateras med `pnpm run update-mandates` efter varje val.
  const partyIdByAbbr = new Map(
    NATIONAL_PARTIES.map((p) => [p.abbreviation, p.id]),
  );
  const seededRegions = new Set<string>();
  const seededMunicipalities = new Set<string>();
  const knownRegionIds = new Set(
    REGIONS.map((r) =>
      slugify(
        r.name.replace(/^(Region |Västra Götalandsregionen)/, (m) =>
          m === "Västra Götalandsregionen" ? "Västra Götaland" : "",
        ),
      ) || slugify(r.name),
    ),
  );
  for (const [regionId, seats] of Object.entries(MANDATES.region)) {
    if (!knownRegionIds.has(regionId)) {
      console.log(`  hoppar över okänd region i mandatdata: ${regionId}`);
      continue;
    }
    seededRegions.add(regionId);
    for (const p of NATIONAL_PARTIES) {
      participation.push({
        partyId: p.id,
        level: "region",
        regionId,
        inAssembly: ((seats as Record<string, number>)[p.abbreviation] ?? 0) > 0,
      });
    }
  }
  for (const [municipalityId, seats] of Object.entries(MANDATES.kommun)) {
    // SCB:s tabeller innehåller även historiska kommuner (t.ex. Bara) —
    // hoppa över allt som inte finns i dagens kommunlista.
    if (!usedMunicipalitySlugs.has(municipalityId)) {
      console.log(`  hoppar över okänd kommun i mandatdata: ${municipalityId}`);
      continue;
    }
    seededMunicipalities.add(municipalityId);
    for (const p of NATIONAL_PARTIES) {
      participation.push({
        partyId: p.id,
        level: "kommun",
        municipalityId,
        inAssembly: ((seats as Record<string, number>)[p.abbreviation] ?? 0) > 0,
      });
    }
  }
  console.log(
    `Mandatdata (valår ${MANDATES.electionYear}): ${seededRegions.size} regioner, ${seededMunicipalities.size} kommuner.`,
  );

  // Lokala partier (ingår i SCB:s "övriga" och läggs in manuellt):
  // Sörmlandslistan sitter i regionfullmäktige i Sörmland.
  participation.push({
    partyId: "sormlandslistan",
    level: "region",
    regionId: "sormland",
    inAssembly: true,
  });
  // Katrineholm Framåt sitter i kommunfullmäktige i Katrineholm.
  participation.push({
    partyId: "katrineholm-framat",
    level: "kommun",
    municipalityId: "katrineholm",
    inAssembly: true,
  });

  // Alla lokala partier med fullmäktigemandat (Valmyndighetens data).
  const manualParticipation = new Set(
    participation.map((r) => `${r.partyId}|${r.level}|${r.regionId ?? ""}|${r.municipalityId ?? ""}`),
  );
  let localRows = 0;
  for (const [regionId, list] of Object.entries(LOCAL_PARTY_DATA.region)) {
    if (!knownRegionIds.has(regionId)) continue;
    for (const { partyId } of list) {
      if (manualParticipation.has(`${partyId}|region|${regionId}|`)) continue;
      participation.push({ partyId, level: "region", regionId, inAssembly: true });
      localRows++;
    }
  }
  for (const [municipalityId, list] of Object.entries(LOCAL_PARTY_DATA.kommun)) {
    if (!usedMunicipalitySlugs.has(municipalityId)) continue;
    for (const { partyId } of list) {
      if (manualParticipation.has(`${partyId}|kommun||${municipalityId}`)) continue;
      participation.push({ partyId, level: "kommun", municipalityId, inAssembly: true });
      localRows++;
    }
  }
  console.log(
    `Lokala partier från Valmyndigheten: ${dataLocalParties.length} partier, ${localRows} fullmäktigeplatser.`,
  );
  await db.insert(partyParticipationTable).values(participation);

  console.log("Seeding questions...");
  type QuestionRow = typeof questionsTable.$inferInsert;
  const questionRows: QuestionRow[] = [];
  const pushQuestions = (
    prefix: string,
    level: string,
    seeds: QuestionSeed[],
    regionId: string | null,
    municipalityId: string | null,
  ) => {
    seeds.forEach(([text, category, explanation], i) => {
      questionRows.push({
        id: `${prefix}-${i + 1}`,
        level,
        regionId,
        municipalityId,
        text,
        category,
        orderIndex: i + 1,
        explanation,
        moreInfo:
          "Frågan är formulerad neutralt av Valkompass redaktion och tar inte ställning.",
        sources: [],
      });
    });
  };
  pushQuestions("rd", "riksdag", RIKSDAG_QUESTIONS, null, null);
  pushQuestions("reg", "region", REGION_QUESTIONS, null, null);
  pushQuestions("kh", "kommun", KATRINEHOLM_QUESTIONS, null, "katrineholm");
  pushQuestions("kom", "kommun", GENERIC_KOMMUN_QUESTIONS, null, null);
  await db.insert(questionsTable).values(questionRows);

  console.log("Seeding party answers (editorial assessments)...");
  type AnswerRow = typeof partyAnswersTable.$inferInsert;
  const answerRows: AnswerRow[] = [];
  // Alla nivåer: redaktionellt bedömda positioner med källor.
  // Riksdag: bedömda direkt från partiets rikspolitik.
  // Region/kommun: riksdagspartiernas lokala föreningar har sällan egna
  // publicerade ståndpunkter — svaren utgår då från rikspolitiken och
  // märks med en motivering som förklarar det.
  const LEVEL_MATRICES: {
    prefix: string;
    positions: Record<string, (number | null)[]>;
    justification: string;
  }[] = [
    { prefix: "rd", positions: RIKSDAG_POSITIONS, justification: EDITORIAL_JUSTIFICATION },
    { prefix: "reg", positions: REGION_POSITIONS, justification: FALLBACK_JUSTIFICATION },
    { prefix: "kh", positions: KATRINEHOLM_POSITIONS, justification: FALLBACK_JUSTIFICATION },
    { prefix: "kom", positions: GENERIC_KOMMUN_POSITIONS, justification: FALLBACK_JUSTIFICATION },
  ];
  // Skydd mot off-by-one: varje matris måste ha exakt en rad per fråga.
  for (const m of LEVEL_MATRICES) {
    const count = questionRows.filter((q) => q.id!.startsWith(`${m.prefix}-`)).length;
    for (const [partyId, values] of Object.entries(m.positions)) {
      if (values.length !== count) {
        throw new Error(
          `Matrisfel: ${partyId} har ${values.length} värden för "${m.prefix}" men det finns ${count} frågor.`,
        );
      }
    }
  }
  const realAnswerFor = (partyId: string, questionId: string) => {
    const [prefix, num] = questionId.split("-");
    const matrix = LEVEL_MATRICES.find((m) => m.prefix === prefix)!;
    const value = matrix.positions[partyId]?.[parseInt(num!, 10) - 1] ?? null;
    answerRows.push({
      partyId,
      questionId,
      value,
      answerOrigin: value == null ? "none" : "editorial",
      justification: value == null ? null : matrix.justification,
      sources: value == null ? [] : [PARTY_SOURCES[partyId]!],
    });
  };
  for (const p of NATIONAL_PARTIES) {
    for (const q of questionRows) realAnswerFor(p.id, q.id!);
  }
  // Katrineholm FRAMÅT: riktiga lokala ståndpunkter från partiets
  // publicerade program (katrineholmframat.se).
  questionRows
    .filter((q) => q.id!.startsWith("kh-"))
    .forEach((q, i) => {
      const value = KF_KATRINEHOLM[i] ?? null;
      answerRows.push({
        partyId: "katrineholm-framat",
        questionId: q.id!,
        value,
        answerOrigin: value == null ? "none" : "editorial",
        justification: value == null ? null : KF_JUSTIFICATION,
        sources: value == null ? [] : [KF_SOURCE],
      });
    });
  // Partier utanför riksdagen: riksdagsfrågorna, delvis ofullständigt
  // underlag — bedömda utifrån respektive partis egna programsidor.
  for (const partyId of [
    "medborgerlig-samling",
    "alternativ-for-sverige",
    "partiet-nyans",
    "piratpartiet",
  ]) {
    for (const q of questionRows.filter((q) => q.id!.startsWith("rd-"))) {
      realAnswerFor(partyId, q.id!);
    }
  }
  // Sörmlandslistan: ingen publicerad politik att bedöma — inga svar alls.
  // Partiet visas under "Fler partier som ställer upp" som ej kvalificerat.

  // Lokala partier med redaktionellt bedömda svar från deras egna
  // webbplatser (localPartyResearch.json). Endast kommunfrågorna (kom-).
  const komQuestions = questionRows.filter((q) => q.id!.startsWith("kom-"));
  // Skydd mot att frågorna ändras/omordnas utan att researchen görs om:
  // fingeravtrycket (första/sista frågetexten + antal) måste stämma exakt.
  const fp = LOCAL_PARTY_RESEARCH.questionFingerprint;
  if (
    fp.count !== komQuestions.length ||
    fp.first !== komQuestions[0]!.text ||
    fp.last !== komQuestions[komQuestions.length - 1]!.text
  ) {
    throw new Error(
      "Researchfel: kommunfrågorna matchar inte questionFingerprint i localPartyResearch.json — gör om researchen innan seedning.",
    );
  }
  let researchAnswerCount = 0;
  const dataLocalIds = new Set(dataLocalParties.map((p) => p.id));
  for (const [partyId, research] of Object.entries(LOCAL_PARTY_RESEARCH.parties)) {
    if (!research.answers || !dataLocalIds.has(partyId)) continue;
    if (research.answers.length !== komQuestions.length) {
      throw new Error(
        `Researchfel: ${partyId} har ${research.answers.length} värden men det finns ${komQuestions.length} kommunfrågor.`,
      );
    }
    komQuestions.forEach((q, i) => {
      const value = research.answers![i] ?? null;
      answerRows.push({
        partyId,
        questionId: q.id!,
        value,
        answerOrigin: value == null ? "none" : "editorial",
        justification: value == null ? null : LOCAL_RESEARCH_JUSTIFICATION,
        sources:
          value == null
            ? []
            : (research.sources.length
                ? research.sources
                : research.website
                  ? [research.website]
                  : []
              ).map((url) => {
                // Märk källan ärligt: bara partiets egen domän får heta
                // "Partiets webbplats", allt annat är extern källa.
                const host = url.match(/^https?:\/\/([^/]+)/)?.[1] ?? "";
                const siteHost =
                  research.website?.match(/^https?:\/\/([^/]+)/)?.[1] ?? null;
                const own =
                  siteHost &&
                  (host === siteHost ||
                    host.replace(/^www\./, "") === siteHost.replace(/^www\./, ""));
                return {
                  title: own ? "Partiets webbplats" : `Extern källa (${host})`,
                  url,
                };
              }),
      });
      if (value != null) researchAnswerCount++;
    });
  }
  console.log(
    `Lokalpartiresearch: ${Object.keys(LOCAL_PARTY_RESEARCH.parties).length} partier med hemsida/beskrivning, ${researchAnswerCount} bedömda svar.`,
  );

  // Insert in chunks to stay under parameter limits.
  for (let i = 0; i < answerRows.length; i += 500) {
    await db.insert(partyAnswersTable).values(answerRows.slice(i, i + 500));
  }

  console.log(
    `Done. ${REGIONS.length} regions, ${REGIONS.reduce((n, r) => n + r.municipalities.length, 0)} municipalities, ${allParties.length} parties, ${questionRows.length} questions, ${answerRows.length} answers.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
