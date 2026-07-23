import { Router, type IRouter } from "express";
import {
  GetQuizParams,
  GetQuizQueryParams,
  GetQuizResponse,
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

router.get("/quiz/:level", async (req, res): Promise<void> => {
  const params = GetQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ message: "Ogiltig valnivå" });
    return;
  }
  const query = GetQuizQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: "Ogiltiga parametrar" });
    return;
  }
  const level = params.data.level;
  if (level !== "riksdag" && !query.data.municipalityId) {
    res
      .status(400)
      .json({ message: "municipalityId krävs för region- och kommunval" });
    return;
  }
  const ctx = await resolveContext(level, query.data.municipalityId);
  if (!ctx) {
    res.status(404).json({ message: "Kommunen hittades inte" });
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
    GetQuizResponse.parse({
      level: ctx.level,
      // In areas without seeded local participation we fall back to the
      // national parties and do not know fullmäktige membership — the
      // clients hide the "sitter redan i fullmäktige" filter then.
      hasAssemblyData: parties.some((p) => p.inAssembly),
      areaName: ctx.areaName,
      regionName: ctx.regionName,
      electionName: ctx.electionName,
      questions: questions.map(serializeQuestion),
      parties: parties.map((p) => {
        const partyAnswers = answersByParty.get(p.id) ?? [];
        return {
          ...serializeParty(p, partyAnswers, questions.length),
          answers: partyAnswers.map(serializeAnswer),
        };
      }),
    }),
  );
});

export default router;
