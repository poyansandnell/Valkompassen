import { Router, type IRouter } from "express";
import { count, eq, isNull, and } from "drizzle-orm";
import {
  challengesTable,
  completionEventsTable,
  db,
  resultPagesTable,
} from "@workspace/db";
import {
  GetStatsResponse,
  RecordCompletionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/stats/completions", async (req, res): Promise<void> => {
  const parsed = RecordCompletionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga uppgifter" });
    return;
  }
  await db.insert(completionEventsTable).values({ level: parsed.data.level });
  res.status(201).json({ message: "Registrerad" });
});

router.get("/stats", async (_req, res): Promise<void> => {
  const levels = ["riksdag", "region", "kommun"] as const;
  const byLevel: Record<string, number> = {};
  for (const level of levels) {
    const [row] = await db
      .select({ n: count() })
      .from(completionEventsTable)
      .where(eq(completionEventsTable.level, level));
    byLevel[level] = row?.n ?? 0;
  }
  const [pages] = await db
    .select({ n: count() })
    .from(resultPagesTable)
    .where(
      and(isNull(resultPagesTable.deletedAt), eq(resultPagesTable.isPublished, true)),
    );
  const [challenges] = await db
    .select({ n: count() })
    .from(challengesTable);
  res.json(
    GetStatsResponse.parse({
      totalCompletions:
        (byLevel.riksdag ?? 0) + (byLevel.region ?? 0) + (byLevel.kommun ?? 0),
      completionsByLevel: {
        riksdag: byLevel.riksdag ?? 0,
        region: byLevel.region ?? 0,
        kommun: byLevel.kommun ?? 0,
      },
      resultPagesCreated: pages?.n ?? 0,
      challengesCreated: challenges?.n ?? 0,
    }),
  );
});

export default router;
