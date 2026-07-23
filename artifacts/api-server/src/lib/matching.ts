// Matching engine — same public algorithm as the frontend (src/lib/matching.ts
// in the web app). Documented publicly on the /metod page.
//
// Answer coding: Instämmer helt=2, delvis=1, varken eller=0,
// tar delvis avstånd=-1, tar helt avstånd=-2. Skipped = null.
// Per question: likhet = 1 - abs(a - b) / 4.
// Total: sum(likhet * vikt) / sum(vikt), as 0–100 %.
// Skipped questions and questions without an established position are excluded.
// No hidden bonuses. Party size, mandates, polls and payment never matter.

export type AnswerValue = number | null;

export type WeightedAnswer = {
  questionId: string;
  value: AnswerValue;
  weight: number;
};

export function questionSimilarity(a: number, b: number): number {
  return 1 - Math.abs(a - b) / 4;
}

export type PairwiseResult = {
  similarityPercent: number;
  basedOnQuestions: number;
  perQuestion: Map<string, number>;
};

// Compare two answer sets (user vs user, or user vs party). Weights are taken
// from the first answer set (the initiating user).
export function compareAnswerSets(
  first: WeightedAnswer[],
  second: { questionId: string; value: AnswerValue }[],
): PairwiseResult {
  const secondByQuestion = new Map(second.map((a) => [a.questionId, a.value]));
  let weightedSum = 0;
  let weightTotal = 0;
  let counted = 0;
  const perQuestion = new Map<string, number>();

  for (const answer of first) {
    if (answer.value == null) continue;
    const other = secondByQuestion.get(answer.questionId);
    if (other == null) continue;
    const similarity = questionSimilarity(answer.value, other);
    const weight = answer.weight > 0 ? answer.weight : 1;
    weightedSum += similarity * weight;
    weightTotal += weight;
    counted += 1;
    perQuestion.set(answer.questionId, similarity);
  }

  return {
    similarityPercent:
      weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 1000) / 10 : 0,
    basedOnQuestions: counted,
    perQuestion,
  };
}

export type TopicAgreement = { category: string; agreementPercent: number };

export function topicAgreements(
  perQuestion: Map<string, number>,
  categoryByQuestion: Map<string, string>,
): TopicAgreement[] {
  const sums = new Map<string, { total: number; count: number }>();
  for (const [questionId, similarity] of perQuestion) {
    const category = categoryByQuestion.get(questionId);
    if (!category) continue;
    const entry = sums.get(category) ?? { total: 0, count: 0 };
    entry.total += similarity;
    entry.count += 1;
    sums.set(category, entry);
  }
  return [...sums.entries()].map(([category, { total, count }]) => ({
    category,
    agreementPercent: Math.round((total / count) * 1000) / 10,
  }));
}
