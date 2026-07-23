/**
 * Redaktionellt bedömda partipositioner för riksdagsfrågorna (rd-1 … rd-30).
 *
 * Skala: 2 = instämmer helt, 1 = instämmer delvis, 0 = varken eller,
 * -1 = tar delvis avstånd, -2 = tar helt avstånd, null = oklart/inte bedömt.
 *
 * Bedömningarna bygger på partiernas officiella program och ställnings-
 * taganden på deras webbplatser (källor nedan). De är redaktionella
 * tolkningar — inte svar inlämnade av partierna själva — och märks därför
 * med answerOrigin "editorial" i databasen.
 */

export const PARTY_SOURCES: Record<string, { title: string; url: string }> = {
  socialdemokraterna: {
    title: "Socialdemokraterna – Vår politik A till Ö",
    url: "https://www.socialdemokraterna.se/var-politik/a-till-o",
  },
  moderaterna: {
    title: "Moderaterna – Vår politik",
    url: "https://moderaterna.se/var-politik/",
  },
  sverigedemokraterna: {
    title: "Sverigedemokraterna – Vad vi vill",
    url: "https://www.sd.se/vad-vi-vill/",
  },
  centerpartiet: {
    title: "Centerpartiet – Politik A–Ö",
    url: "https://www.centerpartiet.se/centerpartiets-politik/centerpartiets-politik-a-o",
  },
  vansterpartiet: {
    title: "Vänsterpartiet – Politik A–Ö",
    url: "https://www.vansterpartiet.se/var-politik/politik-a-o/",
  },
  kristdemokraterna: {
    title: "Kristdemokraterna – Politik A till Ö",
    url: "https://kristdemokraterna.se/var-politik/politik-a-till-o",
  },
  liberalerna: {
    title: "Liberalerna – Politik A–Ö",
    url: "https://www.liberalerna.se/politik-a-o",
  },
  miljopartiet: {
    title: "Miljöpartiet – Vår politik",
    url: "https://www.mp.se/politik/",
  },
  "medborgerlig-samling": {
    title: "Medborgerlig Samling – Politik",
    url: "https://www.med.se/",
  },
};

// Ordning: index 0 = rd-1 … index 29 = rd-30.
export const RIKSDAG_POSITIONS: Record<string, (number | null)[]> = {
  //                     1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30
  socialdemokraterna: [ -2,  1,  0, -1,  2,  1,  1,  1,  1,  1,  0,  1,  1, -1,  1,  1,  1,  1,  2,  1,  1, -1, -1,  2, -1,  0,  0,  2,  2,  2],
  moderaterna:        [  2,  2,  2,  0, -1, -1,  2,  2,  2,  2,  2, -1, -1,  1,  2,  2, -1,  2, -1,  0,  1, -1,  2, -2, -1,  2, -2,  0,  1,  1],
  sverigedemokraterna:[  1,  1,  2,  2,  1,  2,  2,  2,  2,  2,  2, -2, -2,  2,  2,  1,  1,  1,  1,  2,  2, -2,  1,  1,  0,  2, -1,  0,  2,  1],
  centerpartiet:      [  1,  2,  2, -2, -1, -2,  1,  1, -1,  1,  1,  2,  2,  0,  1,  2,  0,  2, -2,  2,  2,  0,  2, -1,  1, -1, -2,  1, -2,  0],
  vansterpartiet:     [ -2, -1, -1,  1,  2,  2, -1, -1, -2, -2, -2,  2,  2, -1,  0, -1,  2, -1,  2,  1,  1, -2, -2,  2,  1, -2,  2,  2,  1,  1],
  kristdemokraterna:  [  1,  2,  2,  2,  0, -1,  2,  2,  1,  2,  2, -1, -1,  2,  2,  2,  1,  2, -1,  1,  2, -1,  1, -1,  0,  2, -2,  0,  1,  1],
  liberalerna:        [  2,  2,  2,  1,  0,  2,  2,  1,  1,  2,  2,  0,  0,  0,  2,  2, -1,  1, -1,  0,  0,  2,  2, -1,  1,  1, -2,  0, -1,  2],
  miljopartiet:       [ -2,  0,  0, -1,  2,  1,  0, -1, -2, -1, -2,  2,  2, -2,  0, -1,  1, -1,  1,  1, -1,  1, -2,  1,  1, -2,  1,  2, -2,  0],
  "medborgerlig-samling": [2, 1,  2, null, -1, null, 2,  1,  2,  2,  2, -2, -2,  1,  2,  2, -1,  2, -2, -2,  1, -2,  2, -2,  1, null, -2, null, null, null],
};

export const EDITORIAL_JUSTIFICATION =
  "Redaktionell bedömning utifrån partiets officiella program och ställningstaganden. Partiet har ännu inte själv bekräftat svaret.";
