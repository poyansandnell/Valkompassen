import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, resultPagesTable, resultPageReportsTable } from "@workspace/db";
import {
  CreateResultPageBody,
  DeleteResultPageParams,
  DeleteResultPageQueryParams,
  GetResultPageParams,
  GetResultPageResponse,
  ReportResultPageBody,
  ReportResultPageParams,
  UpdateResultPageBody,
  UpdateResultPageParams,
  UpdateResultPageResponse,
  CreateResultPageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function serialize(page: typeof resultPagesTable.$inferSelect) {
  return {
    publicSlug: page.publicSlug,
    level: page.level,
    areaName: page.areaName,
    displayName: page.displayName ?? null,
    locality: page.locality ?? null,
    comment: page.comment ?? null,
    showBestParty: page.showBestParty,
    showFullList: page.showFullList,
    showTopics: page.showTopics,
    isIndexable: page.isIndexable,
    isPublished: page.isPublished,
    createdAt: page.createdAt.toISOString(),
    topMatches: page.topMatches,
    topicAgreements: page.topicAgreements,
  };
}

async function findActivePage(slug: string) {
  const [page] = await db
    .select()
    .from(resultPagesTable)
    .where(
      and(
        eq(resultPagesTable.publicSlug, slug),
        isNull(resultPagesTable.deletedAt),
      ),
    );
  return page;
}

router.post("/result-pages", async (req, res): Promise<void> => {
  const parsed = CreateResultPageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga uppgifter" });
    return;
  }
  const data = parsed.data;
  if (!data.confirmPublic) {
    res.status(400).json({
      message: "Du måste bekräfta att sidan blir offentlig innan publicering",
    });
    return;
  }
  const randomPart = randomToken(5).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  const namePart = data.displayName ? slugify(data.displayName) : "";
  const publicSlug = namePart ? `${namePart}-${randomPart}` : randomPart;
  const editToken = randomToken();
  const deleteToken = randomToken();

  await db.insert(resultPagesTable).values({
    publicSlug,
    level: data.level,
    areaName: data.areaName,
    displayName: data.displayName ?? null,
    locality: data.locality ?? null,
    comment: data.comment ?? null,
    showBestParty: data.showBestParty ?? false,
    showFullList: data.showFullList ?? false,
    showTopics: data.showTopics ?? false,
    isIndexable: data.isIndexable ?? false,
    editTokenHash: hashToken(editToken),
    deleteTokenHash: hashToken(deleteToken),
    topMatches: data.topMatches,
    topicAgreements: data.topicAgreements ?? [],
  });

  res
    .status(201)
    .json(CreateResultPageResponse.parse({ publicSlug, editToken, deleteToken }));
});

// Lista över indexerbara sidor för sitemap-generering (intern användning).
router.get("/result-pages-sitemap", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      publicSlug: resultPagesTable.publicSlug,
      createdAt: resultPagesTable.createdAt,
    })
    .from(resultPagesTable)
    .where(
      and(
        eq(resultPagesTable.isIndexable, true),
        eq(resultPagesTable.isPublished, true),
        isNull(resultPagesTable.deletedAt),
      ),
    );
  res.json(
    rows.map((r) => ({
      slug: r.publicSlug,
      lastmod: r.createdAt.toISOString(),
    })),
  );
});

router.get("/result-pages/:slug", async (req, res): Promise<void> => {
  const params = GetResultPageParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  const page = await findActivePage(params.data.slug);
  if (!page || !page.isPublished) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  res.json(GetResultPageResponse.parse(serialize(page)));
});

router.patch("/result-pages/:slug", async (req, res): Promise<void> => {
  const params = UpdateResultPageParams.safeParse(req.params);
  const parsed = UpdateResultPageBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  const page = await findActivePage(params.data.slug);
  if (!page) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  if (hashToken(parsed.data.editToken) !== page.editTokenHash) {
    res.status(403).json({ message: "Ogiltig redigeringslänk" });
    return;
  }
  const { editToken: _editToken, ...updates } = parsed.data;
  const [updated] = await db
    .update(resultPagesTable)
    .set(updates)
    .where(eq(resultPagesTable.id, page.id))
    .returning();
  res.json(UpdateResultPageResponse.parse(serialize(updated!)));
});

router.delete("/result-pages/:slug", async (req, res): Promise<void> => {
  const params = DeleteResultPageParams.safeParse(req.params);
  const query = DeleteResultPageQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  const page = await findActivePage(params.data.slug);
  if (!page) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  if (hashToken(query.data.token) !== page.deleteTokenHash) {
    res.status(403).json({ message: "Ogiltig borttagningslänk" });
    return;
  }
  await db
    .update(resultPagesTable)
    .set({ deletedAt: new Date(), isPublished: false })
    .where(eq(resultPagesTable.id, page.id));
  res.sendStatus(204);
});

router.post("/result-pages/:slug/report", async (req, res): Promise<void> => {
  const params = ReportResultPageParams.safeParse(req.params);
  const parsed = ReportResultPageBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  const page = await findActivePage(params.data.slug);
  if (!page) {
    res.status(404).json({ message: "Sidan hittades inte" });
    return;
  }
  await db.insert(resultPageReportsTable).values({
    publicSlug: page.publicSlug,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  res.status(201).json({ message: "Tack, din rapport har tagits emot" });
});

export default router;
