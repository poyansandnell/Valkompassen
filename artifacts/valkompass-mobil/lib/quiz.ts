import type { QuizPayload } from '@workspace/api-client-react';

export type Level = 'riksdag' | 'region' | 'kommun';

// Same weight set as the web app
export const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 0.75, label: 'Lite viktig' },
  { value: 1, label: 'Ganska viktig' },
  { value: 1.5, label: 'Mycket viktig' },
  { value: 2.25, label: 'Avgörande' },
];
export const WEIGHT_NORMAL = 1;

export interface StoredAnswer {
  value: number | null; // -2..2, null = skipped
  weight: number;
}

export interface LevelMeta {
  level: Level;
  title: string;
  description: string;
  needsMunicipality: boolean;
}

export const LEVELS: LevelMeta[] = [
  {
    level: 'riksdag',
    title: 'Riksdag',
    description: 'Nationella frågor som skatter, försvar och sjukvårdens finansiering.',
    needsMunicipality: false,
  },
  {
    level: 'region',
    title: 'Region',
    description: 'Regionala frågor som sjukvård, kollektivtrafik och regional utveckling.',
    needsMunicipality: true,
  },
  {
    level: 'kommun',
    title: 'Kommun',
    description: 'Lokala frågor som skola, äldreomsorg och samhällsbyggnad där du bor.',
    needsMunicipality: true,
  },
];

// Same scale wording as the web app
export const SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: 'Instämmer helt' },
  { value: 1, label: 'Instämmer delvis' },
  { value: 0, label: 'Varken eller' },
  { value: -1, label: 'Tar delvis avstånd' },
  { value: -2, label: 'Tar helt avstånd' },
];

export function answerKey(level: Level, municipalityId?: string | null): string {
  return `${level}:${municipalityId ?? 'national'}`;
}

export interface PartyMatch {
  partyId: string;
  name: string;
  abbreviation: string;
  slug: string;
  color: string;
  matchPercent: number;
  basedOnQuestions: number;
  totalQuestions: number;
  isQualified: boolean;
  isTestData: boolean;
  inAssembly: boolean;
}

/**
 * likhet = 1 - |user - party| / 4, weighted average over questions the user
 * answered (not skipped) and the party has a position on.
 */
export function computeMatches(
  quiz: QuizPayload,
  answers: Record<string, StoredAnswer>,
): PartyMatch[] {
  const matches: PartyMatch[] = quiz.parties.map((party) => {
    let weightedSum = 0;
    let weightTotal = 0;
    let basedOn = 0;

    for (const pa of party.answers) {
      const ua = answers[pa.questionId];
      if (!ua || ua.value === null || pa.value === null || pa.value === undefined) continue;
      const similarity = 1 - Math.abs(ua.value - pa.value) / 4;
      weightedSum += similarity * ua.weight;
      weightTotal += ua.weight;
      basedOn += 1;
    }

    const matchPercent = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;

    return {
      partyId: party.id,
      name: party.name,
      abbreviation: party.abbreviation,
      slug: party.slug,
      color: party.color,
      matchPercent,
      basedOnQuestions: basedOn,
      totalQuestions: quiz.questions.length,
      isQualified: party.isQualified,
      isTestData: party.isTestData,
      inAssembly: party.inAssembly,
    };
  });

  return matches.sort((a, b) => b.matchPercent - a.matchPercent);
}

export function answeredCount(answers: Record<string, StoredAnswer>): number {
  return Object.values(answers).filter((a) => a.value !== null).length;
}
