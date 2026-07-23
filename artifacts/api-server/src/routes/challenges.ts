import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import { challengesTable, db, questionsTable } from "@workspace/db";
import {
  CompleteChallengeBody,
  CompleteChallengeParams,
  CompleteChallengeResponse,
  CreateChallengeBody,
  CreateChallengeResponse,
  GetChallengeParams,
  GetChallengeResponse,
} from "@workspace/api-zod";
import { compareAnswerSets, topicAgreements } from "../lib/matching";

const CHALLENGE_TTL_DAYS = 90;

const router: IRouter = Router();

router.post("/challenges", async (req, res): Promise<void> => {
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga uppgifter" });
    return;
  }
  const code = randomBytes(6)
    .toString("base64url")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const expiresAt = new Date(
    Date.now() + CHALLENGE_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  await db.insert(challengesTable).values({
    code,
    level: parsed.data.level,
    areaName: parsed.data.areaName,
    municipalityId: parsed.data.municipalityId ?? null,
    senderName: parsed.data.senderName ?? null,
    answers: parsed.data.answers,
    expiresAt,
  });
  res.status(201).json(
    CreateChallengeResponse.parse({
      code,
      expiresAt: expiresAt.toISOString(),
    }),
  );
});

router.get("/challenges/:code", async (req, res): Promise<void> => {
  const params = GetChallengeParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ message: "Utmaningen hittades inte" });
    return;
  }
  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.code, params.data.code));
  if (!challenge || challenge.expiresAt < new Date()) {
    res
      .status(404)
      .json({ message: "Utmaningen hittades inte eller har gått ut" });
    return;
  }
  // Never reveal the sender's individual answers.
  res.json(
    GetChallengeResponse.parse({
      code: challenge.code,
      level: challenge.level,
      areaName: challenge.areaName,
      municipalityId: challenge.municipalityId,
      senderName: challenge.senderName,
      questionCount: challenge.answers.length,
      isCompleted: challenge.completedCount > 0,
    }),
  );
});

router.post("/challenges/:code/complete", async (req, res): Promise<void> => {
  const params = CompleteChallengeParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ message: "Utmaningen hittades inte" });
    return;
  }
  const parsed = CompleteChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga svar" });
    return;
  }
  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.code, params.data.code));
  if (!challenge || challenge.expiresAt < new Date()) {
    res
      .status(404)
      .json({ message: "Utmaningen hittades inte eller har gått ut" });
    return;
  }

  const comparison = compareAnswerSets(
    challenge.answers.map((a) => ({ ...a, weight: 1 })),
    parsed.data.answers,
  );

  const questionIds = [...comparison.perQuestion.keys()];
  const categoryByQuestion = new Map<string, string>();
  if (questionIds.length > 0) {
    const rows = await db
      .select({ id: questionsTable.id, category: questionsTable.category })
      .from(questionsTable)
      .where(inArray(questionsTable.id, questionIds));
    for (const row of rows) categoryByQuestion.set(row.id, row.category);
  }
  const topics = topicAgreements(comparison.perQuestion, categoryByQuestion);
  const sorted = [...topics].sort(
    (a, b) => b.agreementPercent - a.agreementPercent,
  );

  await db
    .update(challengesTable)
    .set({ completedCount: sql`${challengesTable.completedCount} + 1` })
    .where(eq(challengesTable.id, challenge.id));

  res.json(
    CompleteChallengeResponse.parse({
      similarityPercent: comparison.similarityPercent,
      basedOnQuestions: comparison.basedOnQuestions,
      senderName: challenge.senderName,
      mostAgreedTopics: sorted.slice(0, 3),
      mostDisagreedTopics: sorted.slice(-3).reverse(),
    }),
  );
});

export default router;
