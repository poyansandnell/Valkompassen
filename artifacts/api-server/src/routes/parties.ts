import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, partiesTable } from "@workspace/db";
import {
  GetPartyProfileParams,
  GetPartyProfileQueryParams,
  GetPartyProfileResponse,
  ListPartiesQueryParams,
  ListPartiesResponse,
} from "@workspace/api-zod";
import {
  answersFor,
  partiesFor,
  questionsFor,
  resolveContext,
  serializeAnswer,
  serializeParty,
  serializeQuestion,
} from "../lib/quizData";

const router: IRouter = Router();

router.get("/parties", async (req, res): Promise<void> => {
  const query = ListPartiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Ogiltiga parametrar" });
    return;
  }
  const ctx = await resolveContext(query.data.level, query.data.municipalityId);
  if (!ctx) {
    res.json(ListPartiesResponse.parse([]));
    return;
  }
  const questions = await questionsFor(ctx);
  const parties = await partiesFor(ctx);
  const answers = await answersFor(
    parties.map((p) => p.id),
    questions.map((q) => q.id),
  );
  const answersByParty = new Map<string, typeof answers>();
  for (const a of answers) {
    const list = answersByParty.get(a.partyId) ?? [];
    list.push(a);
    answersByParty.set(a.partyId, list);
  }
  res.json(
    ListPartiesResponse.parse(
      parties.map((p) =>
        serializeParty(p, answersByParty.get(p.id) ?? [], questions.length),
      ),
    ),
  );
});

router.get("/parties/:slug", async (req, res): Promise<void> => {
  const params = GetPartyProfileParams.safeParse(req.params);
  const query = GetPartyProfileQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(404).json({ message: "Partiet hittades inte" });
    return;
  }
  const [party] = await db
    .select()
    .from(partiesTable)
    .where(eq(partiesTable.slug, params.data.slug));
  if (!party) {
    res.status(404).json({ message: "Partiet hittades inte" });
    return;
  }
  const ctx = await resolveContext(query.data.level, query.data.municipalityId);
  if (!ctx) {
    res.status(404).json({ message: "Området hittades inte" });
    return;
  }
  const questions = await questionsFor(ctx);
  const answers = await answersFor(
    [party.id],
    questions.map((q) => q.id),
  );
  res.json(
    GetPartyProfileResponse.parse({
      party: serializeParty(party, answers, questions.length),
      questions: questions.map(serializeQuestion),
      answers: answers.map(serializeAnswer),
    }),
  );
});

export default router;
