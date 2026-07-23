import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  db,
  municipalitiesTable,
  partiesTable,
  partyAnswersTable,
  partyParticipationTable,
  questionsTable,
  regionsTable,
  type Municipality,
  type Party,
  type PartyAnswer,
  type Question,
  type Region,
} from "@workspace/db";

export type Level = "riksdag" | "region" | "kommun";

export type QuizContext = {
  level: Level;
  areaName: string;
  regionName: string | null;
  electionName: string;
  municipality: Municipality | null;
  region: Region | null;
};

export async function resolveContext(
  level: Level,
  municipalityId?: string,
): Promise<QuizContext | null> {
  if (level === "riksdag") {
    return {
      level,
      areaName: "Sverige",
      regionName: null,
      electionName: "Riksdagsvalet",
      municipality: null,
      region: null,
    };
  }
  if (!municipalityId) return null;
  const [municipality] = await db
    .select()
    .from(municipalitiesTable)
    .where(eq(municipalitiesTable.id, municipalityId));
  if (!municipality) return null;
  const [region] = await db
    .select()
    .from(regionsTable)
    .where(eq(regionsTable.id, municipality.regionId));
  if (!region) return null;
  return {
    level,
    areaName: level === "kommun" ? municipality.name : region.name,
    regionName: region.name,
    electionName:
      level === "kommun"
        ? `Kommunvalet i ${municipality.name}`
        : `Regionvalet i ${region.name}`,
    municipality,
    region,
  };
}

// Area-specific questions if any exist, otherwise the generic fallback set
// for the level (regionId/municipalityId is null).
export async function questionsFor(ctx: QuizContext): Promise<Question[]> {
  if (ctx.level === "riksdag") {
    return db
      .select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.level, "riksdag"),
          eq(questionsTable.status, "published"),
        ),
      )
      .orderBy(questionsTable.orderIndex);
  }
  const areaFilter =
    ctx.level === "region"
      ? eq(questionsTable.regionId, ctx.region!.id)
      : eq(questionsTable.municipalityId, ctx.municipality!.id);
  const specific = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.level, ctx.level),
        eq(questionsTable.status, "published"),
        areaFilter,
      ),
    )
    .orderBy(questionsTable.orderIndex);
  if (specific.length > 0) return specific;
  const fallbackFilter =
    ctx.level === "region"
      ? isNull(questionsTable.regionId)
      : isNull(questionsTable.municipalityId);
  return db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.level, ctx.level),
        eq(questionsTable.status, "published"),
        fallbackFilter,
      ),
    )
    .orderBy(questionsTable.orderIndex);
}

export type PartyWithAssembly = Party & { inAssembly: boolean };

export async function partiesFor(
  ctx: QuizContext,
): Promise<PartyWithAssembly[]> {
  const inAssemblyById = new Map<string, boolean>();
  let participantIds: string[];
  if (ctx.level === "riksdag") {
    const rows = await db
      .select({
        partyId: partyParticipationTable.partyId,
        inAssembly: partyParticipationTable.inAssembly,
      })
      .from(partyParticipationTable)
      .where(eq(partyParticipationTable.level, "riksdag"));
    participantIds = rows.map((r) => r.partyId);
    for (const r of rows) inAssemblyById.set(r.partyId, r.inAssembly);
  } else {
    const areaFilter =
      ctx.level === "region"
        ? eq(partyParticipationTable.regionId, ctx.region!.id)
        : eq(partyParticipationTable.municipalityId, ctx.municipality!.id);
    const rows = await db
      .select({
        partyId: partyParticipationTable.partyId,
        inAssembly: partyParticipationTable.inAssembly,
      })
      .from(partyParticipationTable)
      .where(and(eq(partyParticipationTable.level, ctx.level), areaFilter));
    participantIds = rows.map((r) => r.partyId);
    for (const r of rows) inAssemblyById.set(r.partyId, r.inAssembly);
    if (participantIds.length === 0) {
      // Fallback for areas without seeded local participation: the national
      // parties (they run in nearly every region/municipality). We do not
      // know local assembly membership here, so inAssembly stays false.
      const national = await db
        .select({ partyId: partyParticipationTable.partyId })
        .from(partyParticipationTable)
        .where(eq(partyParticipationTable.level, "riksdag"));
      participantIds = national.map((r) => r.partyId);
    }
  }
  if (participantIds.length === 0) return [];
  const parties = await db
    .select()
    .from(partiesTable)
    .where(inArray(partiesTable.id, participantIds));
  return parties
    .map((p) => ({ ...p, inAssembly: inAssemblyById.get(p.id) ?? false }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

export async function answersFor(
  partyIds: string[],
  questionIds: string[],
): Promise<PartyAnswer[]> {
  if (partyIds.length === 0 || questionIds.length === 0) return [];
  return db
    .select()
    .from(partyAnswersTable)
    .where(
      and(
        inArray(partyAnswersTable.partyId, partyIds),
        inArray(partyAnswersTable.questionId, questionIds),
      ),
    );
}

export function serializeQuestion(q: Question) {
  return {
    id: q.id,
    text: q.text,
    category: q.category,
    orderIndex: q.orderIndex,
    explanation: q.explanation ?? null,
    moreInfo: q.moreInfo ?? null,
    sources: q.sources ?? [],
  };
}

export function serializeAnswer(a: PartyAnswer) {
  return {
    questionId: a.questionId,
    value: a.value ?? null,
    answerOrigin: a.answerOrigin,
    justification: a.justification ?? null,
    sources: a.sources ?? [],
  };
}

export function serializeParty(
  party: Party & { inAssembly?: boolean },
  answers: PartyAnswer[],
  totalQuestions: number,
) {
  const answeredCount = answers.filter(
    (a) => a.value != null && a.answerOrigin !== "none",
  ).length;
  const latest = answers.reduce<Date | null>(
    (acc, a) => (acc == null || a.updatedAt > acc ? a.updatedAt : acc),
    null,
  );
  return {
    id: party.id,
    name: party.name,
    slug: party.slug,
    abbreviation: party.abbreviation,
    color: party.color,
    description: party.description ?? null,
    website: party.website ?? null,
    isQualified:
      totalQuestions > 0 && answeredCount >= Math.ceil(totalQuestions * 0.75),
    answeredCount,
    totalQuestions,
    isTestData: party.isTestData,
    inAssembly: party.inAssembly ?? false,
    answersUpdatedAt: latest ? latest.toISOString() : null,
  };
}
