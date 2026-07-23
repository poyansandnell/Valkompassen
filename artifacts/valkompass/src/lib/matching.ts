import { PartyMatchSummary, QuizParty, QuizQuestion, TopicAgreement, UserAnswer } from '@workspace/api-client-react';

// Weights mappings
export const WEIGHTS = {
  '0.75': 'Lite viktig',
  '1': 'Ganska viktig',
  '1.5': 'Mycket viktig',
  '2.25': 'Avgörande',
} as const;

// Internal representation for matching:
// Instämmer helt = 2
// Instämmer delvis = 1
// Varken eller = 0
// Tar delvis avstånd = -1
// Tar helt avstånd = -2
// Hoppa över = null

export function calculateLikhet(userValue: number | null, partyValue: number | null): number | null {
  if (userValue === null || partyValue === null) return null;
  return 1 - Math.abs(userValue - partyValue) / 4;
}

export function calculateMatches(
  parties: QuizParty[],
  userAnswers: UserAnswer[],
  questions: QuizQuestion[]
): PartyMatchSummary[] {
  return parties
    .filter((party) => party.isQualified)
    .map((party) => {
      let totalVikt = 0;
      let totalMatch = 0;
      let basedOnQuestions = 0;

      for (const answer of userAnswers) {
        if (answer.value === null) continue; // User skipped

        const partyAnswer = party.answers.find((a) => a.questionId === answer.questionId);
        const partyValue = partyAnswer?.value ?? null;

        if (partyValue === null) continue; // Party has no established position

        const likhet = calculateLikhet(answer.value, partyValue);
        if (likhet !== null) {
          totalMatch += likhet * answer.weight;
          totalVikt += answer.weight;
          basedOnQuestions++;
        }
      }

      const matchPercent = totalVikt > 0 ? Math.round((totalMatch / totalVikt) * 100) : 0;

      return {
        partyName: party.name,
        partyAbbreviation: party.abbreviation,
        partySlug: party.slug,
        partyColor: party.color,
        matchPercent,
        basedOnQuestions,
        totalQuestions: questions.length,
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

export function calculateTopicAgreements(
  party: QuizParty,
  userAnswers: UserAnswer[],
  questions: QuizQuestion[]
): TopicAgreement[] {
  const categories = [...new Set(questions.map((q) => q.category))];

  return categories.map((category) => {
    const categoryQuestions = questions.filter((q) => q.category === category);
    const categoryQuestionIds = new Set(categoryQuestions.map((q) => q.id));

    let totalVikt = 0;
    let totalMatch = 0;

    for (const answer of userAnswers) {
      if (!categoryQuestionIds.has(answer.questionId)) continue;
      if (answer.value === null) continue;

      const partyAnswer = party.answers.find((a) => a.questionId === answer.questionId);
      const partyValue = partyAnswer?.value ?? null;

      if (partyValue === null) continue;

      const likhet = calculateLikhet(answer.value, partyValue);
      if (likhet !== null) {
        totalMatch += likhet * answer.weight;
        totalVikt += answer.weight;
      }
    }

    const agreementPercent = totalVikt > 0 ? Math.round((totalMatch / totalVikt) * 100) : 0;

    return {
      category,
      agreementPercent,
    };
  });
}

export function calculateUserSimilarity(
  answersA: UserAnswer[],
  answersB: UserAnswer[],
  questions: QuizQuestion[]
): { similarityPercent: number; basedOnQuestions: number; mostAgreedTopics: TopicAgreement[]; mostDisagreedTopics: TopicAgreement[] } {
  let totalVikt = 0;
  let totalMatch = 0;
  let basedOnQuestions = 0;

  for (const answerA of answersA) {
    if (answerA.value === null) continue;
    const answerB = answersB.find((b) => b.questionId === answerA.questionId);
    if (!answerB || answerB.value === null) continue;

    // Use weight from User A as the baseline, or average them.
    // The requirement implies symmetric comparison. We can just use weight 1 for simplicity in comparison, or average their weights.
    // Let's use weight 1 for user-to-user comparison since it's symmetric.
    const likhet = calculateLikhet(answerA.value, answerB.value);
    if (likhet !== null) {
      totalMatch += likhet; // ignoring individual weight for simplicity of friend comparison, or we could use average weight
      totalVikt += 1;
      basedOnQuestions++;
    }
  }

  const similarityPercent = totalVikt > 0 ? Math.round((totalMatch / totalVikt) * 100) : 0;

  const categories = [...new Set(questions.map((q) => q.category))];
  const topicAgreements: TopicAgreement[] = categories.map((category) => {
    const categoryQuestions = questions.filter((q) => q.category === category);
    const categoryQuestionIds = new Set(categoryQuestions.map((q) => q.id));

    let catMatch = 0;
    let catVikt = 0;

    for (const answerA of answersA) {
      if (!categoryQuestionIds.has(answerA.questionId) || answerA.value === null) continue;
      const answerB = answersB.find((b) => b.questionId === answerA.questionId);
      if (!answerB || answerB.value === null) continue;

      const likhet = calculateLikhet(answerA.value, answerB.value);
      if (likhet !== null) {
        catMatch += likhet;
        catVikt += 1;
      }
    }

    return {
      category,
      agreementPercent: catVikt > 0 ? Math.round((catMatch / catVikt) * 100) : 0,
    };
  });

  const sortedTopics = [...topicAgreements].filter(t => {
    // Only include topics where at least one question was answered by both
    const catQs = questions.filter(q => q.category === t.category);
    return answersA.some(a => catQs.some(cq => cq.id === a.questionId) && a.value !== null) &&
           answersB.some(b => catQs.some(cq => cq.id === b.questionId) && b.value !== null);
  }).sort((a, b) => b.agreementPercent - a.agreementPercent);

  return {
    similarityPercent,
    basedOnQuestions,
    mostAgreedTopics: sortedTopics.slice(0, 3),
    mostDisagreedTopics: sortedTopics.slice(-3).reverse(),
  };
}
