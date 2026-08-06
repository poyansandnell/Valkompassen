import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  partiesTable,
  partyAnswersTable,
  partyParticipationTable,
  partySubmissionsTable,
  questionsTable,
  municipalitiesTable,
} from "@workspace/db";
import { sendEmail, publicOrigin } from "../lib/email";

const router: IRouter = Router();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

// Enkel rate limit: max 5 inskick per IP per timme.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const recentByIp = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (ts.length >= RATE_LIMIT) {
    recentByIp.set(ip, ts);
    return true;
  }
  ts.push(now);
  recentByIp.set(ip, ts);
  if (recentByIp.size > 10000) recentByIp.clear();
  return false;
}

function emailDomain(email: string): string | null {
  const m = email.toLowerCase().match(/@([a-z0-9.-]+)$/);
  return m ? m[1]!.replace(/^www\./, "") : null;
}
function websiteHost(website: string | null): string | null {
  if (!website) return null;
  const m = website.toLowerCase().match(/^https?:\/\/([^/]+)/);
  return m ? m[1]!.replace(/^www\./, "") : null;
}
// Domänmatch: mejladressens domän är partiets webbdomän eller en subdomän.
function domainsMatch(email: string, website: string | null): boolean {
  const ed = emailDomain(email);
  const wh = websiteHost(website);
  if (!ed || !wh) return false;
  // Endast riktningen "mejladressen tillhör partiets webbdomän" räknas.
  return ed === wh || ed.endsWith(`.${wh}`);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CreateBody = z.object({
  partyId: z.string().min(1),
  level: z.enum(["riksdag", "region", "kommun"]),
  municipalityId: z.string().nullish(),
  regionId: z.string().nullish(),
  contactName: z.string().max(200).nullish(),
  email: z.string().email().max(320),
  answers: z.record(z.string(), z.number().int().min(-2).max(2).nullable()),
  // Honeypot
  website: z.string().optional(),
});

const PARTY_JUSTIFICATION =
  "Partiets eget svar, inskickat och verifierat via e-post.";

async function questionIdsForContext(
  level: string,
  regionId: string | null,
  municipalityId: string | null,
): Promise<string[]> {
  // Samma logik som quizet: områdesspecifika frågor om de finns, annars
  // de generiska för nivån.
  const rows = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.level, level),
        municipalityId
          ? eq(questionsTable.municipalityId, municipalityId)
          : isNull(questionsTable.municipalityId),
        regionId
          ? eq(questionsTable.regionId, regionId)
          : isNull(questionsTable.regionId),
      ),
    );
  if (rows.length > 0) return rows.map((r) => r.id);
  if (!municipalityId && !regionId) return [];
  // Fall tillbaka på generiska frågor för nivån.
  const generic = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.level, level),
        isNull(questionsTable.municipalityId),
        isNull(questionsTable.regionId),
      ),
    );
  return generic.map((r) => r.id);
}

async function applySubmission(
  submission: typeof partySubmissionsTable.$inferSelect,
): Promise<void> {
  const [party] = await db
    .select()
    .from(partiesTable)
    .where(eq(partiesTable.id, submission.partyId));
  const sources = party?.website
    ? [{ title: "Partiets webbplats", url: party.website }]
    : [];
  const entries = Object.entries(submission.answers);
  const questionIds = entries.map(([qid]) => qid);
  if (questionIds.length === 0) return;
  // Ersätt tidigare svar (redaktionella eller gamla) för dessa frågor.
  await db
    .delete(partyAnswersTable)
    .where(
      and(
        eq(partyAnswersTable.partyId, submission.partyId),
        inArray(partyAnswersTable.questionId, questionIds),
      ),
    );
  await db.insert(partyAnswersTable).values(
    entries.map(([questionId, value]) => ({
      partyId: submission.partyId,
      questionId,
      value,
      answerOrigin: value == null ? "none" : "party",
      justification: value == null ? null : PARTY_JUSTIFICATION,
      sources: value == null ? [] : sources,
    })),
  );
}

// ------------------------------------------------ skapa inskick
router.post("/party-submissions", async (req, res): Promise<void> => {
  if (typeof req.body?.website === "string" && req.body.website.length > 0) {
    res.status(201).json({ message: "Tack! Kolla din e-post." });
    return;
  }
  if (isRateLimited(req.ip ?? "unknown")) {
    res.status(429).json({ message: "För många försök. Vänta en stund." });
    return;
  }
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga uppgifter" });
    return;
  }
  const { partyId, level, email, answers, contactName } = parsed.data;
  const municipalityId = parsed.data.municipalityId ?? null;
  const regionId = parsed.data.regionId ?? null;

  const [party] = await db
    .select()
    .from(partiesTable)
    .where(eq(partiesTable.id, partyId));
  if (!party) {
    res.status(404).json({ message: "Partiet hittades inte" });
    return;
  }
  const participation = await db
    .select()
    .from(partyParticipationTable)
    .where(
      and(
        eq(partyParticipationTable.partyId, partyId),
        eq(partyParticipationTable.level, level),
      ),
    );
  const inContext = participation.some(
    (p) =>
      (municipalityId ? p.municipalityId === municipalityId : true) &&
      (regionId ? p.regionId === regionId : true),
  );
  if (!inContext) {
    res.status(400).json({ message: "Partiet ställer inte upp i det valet" });
    return;
  }

  const validIds = new Set(
    await questionIdsForContext(level, regionId, municipalityId),
  );
  const answerEntries = Object.entries(answers).filter(([qid]) =>
    validIds.has(qid),
  );
  const answeredCount = answerEntries.filter(([, v]) => v != null).length;
  if (answerEntries.length === 0 || answeredCount === 0) {
    res.status(400).json({ message: "Minst ett svar krävs" });
    return;
  }

  const token = randomToken();
  const domainMatch = domainsMatch(email, party.website);
  const [submission] = await db
    .insert(partySubmissionsTable)
    .values({
      partyId,
      level,
      regionId,
      municipalityId,
      contactEmail: email.trim().toLowerCase(),
      contactName: contactName?.trim() || null,
      answers: Object.fromEntries(answerEntries),
      status: "pending_email",
      domainMatch,
      verifyTokenHash: hashToken(token),
    })
    .returning();

  const verifyUrl = `${publicOrigin()}/partisvar/verifiera?token=${token}`;
  try {
    await sendEmail({
      to: email,
      subject: `Bekräfta ${party.name}s svar till Valkompass`,
      html: `<p>Hej${contactName ? " " + escapeHtml(contactName) : ""}!</p>
<p>Du har skickat in svar för <strong>${escapeHtml(party.name)}</strong> till Valkompass (${answeredCount} besvarade frågor).</p>
<p>Klicka på länken för att bekräfta att det är du som skickat in svaren:</p>
<p><a href="${verifyUrl}">Bekräfta svaren</a></p>
<p>Om du inte skickat in några svar kan du bortse från det här mejlet.</p>
<p>— Valkompass</p>`,
    });
  } catch (err) {
    req.log?.error({ err }, "Kunde inte skicka verifieringsmejl");
    await db
      .delete(partySubmissionsTable)
      .where(eq(partySubmissionsTable.id, submission!.id));
    res.status(502).json({
      message:
        "Bekräftelsemejlet kunde inte skickas just nu. Försök igen senare.",
    });
    return;
  }

  res.status(201).json({
    message: "Tack! Ett bekräftelsemejl har skickats.",
    domainMatch,
  });
});

// ------------------------------------------------ e-postverifiering
router.get(
  "/party-submissions/verify",
  async (req, res): Promise<void> => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      res.status(400).json({ message: "Ogiltig länk" });
      return;
    }
    const [submission] = await db
      .select()
      .from(partySubmissionsTable)
      .where(eq(partySubmissionsTable.verifyTokenHash, hashToken(token)));
    if (!submission) {
      res.status(404).json({ message: "Länken är ogiltig eller förbrukad" });
      return;
    }
    if (submission.status !== "pending_email") {
      res.status(200).json({ status: submission.status });
      return;
    }

    if (submission.domainMatch) {
      // Atomisk statusövergång skyddar mot dubbelklick/race.
      const [claimed] = await db
        .update(partySubmissionsTable)
        .set({
          status: "approved",
          emailVerifiedAt: new Date(),
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(partySubmissionsTable.id, submission.id),
            eq(partySubmissionsTable.status, "pending_email"),
          ),
        )
        .returning();
      if (claimed) await applySubmission(claimed);
      res.status(200).json({ status: "approved" });
      return;
    }

    // Ingen domänmatch: lägg i granskningskön och mejla administratören.
    const reviewToken = randomToken();
    await db
      .update(partySubmissionsTable)
      .set({
        status: "pending_review",
        emailVerifiedAt: new Date(),
        reviewTokenHash: hashToken(reviewToken),
      })
      .where(eq(partySubmissionsTable.id, submission.id));

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const [party] = await db
        .select()
        .from(partiesTable)
        .where(eq(partiesTable.id, submission.partyId));
      let areaName = "";
      if (submission.municipalityId) {
        const [muni] = await db
          .select()
          .from(municipalitiesTable)
          .where(eq(municipalitiesTable.id, submission.municipalityId));
        areaName = muni ? ` (${muni.name})` : "";
      }
      const answered = Object.values(submission.answers).filter(
        (v) => v != null,
      ).length;
      const base = `${publicOrigin()}/api/party-submissions/review?token=${reviewToken}`;
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Granska partisvar: ${party?.name ?? submission.partyId}${areaName}`,
          html: `<p><strong>${escapeHtml(party?.name ?? submission.partyId)}</strong>${escapeHtml(areaName)} har skickat in ${answered} svar.</p>
<p>Avsändare: ${escapeHtml(submission.contactName ?? "okänd")} &lt;${escapeHtml(submission.contactEmail)}&gt;<br>
Partiets webbplats: ${escapeHtml(party?.website ?? "saknas")}<br>
E-postdomänen matchar inte partiets webbdomän — manuell granskning krävs.</p>
<p><a href="${base}">Öppna granskningssidan</a> för att godkänna eller avvisa svaren.</p>`,
        });
      } catch (err) {
        req.log?.error({ err }, "Kunde inte mejla administratören");
      }
    }
    res.status(200).json({ status: "pending_review" });
  },
);

// ------------------------------------------------ manuell granskning (via mejllänk)
const reviewPage = (body: string) =>
  `<!doctype html><html lang="sv"><meta charset="utf-8"><body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1 style="font-size:1.3rem">Valkompass – granskning</h1>${body}</body></html>`;

async function findReviewSubmission(token: string) {
  if (!token) return null;
  const [submission] = await db
    .select()
    .from(partySubmissionsTable)
    .where(eq(partySubmissionsTable.reviewTokenHash, hashToken(token)));
  return submission ?? null;
}

// GET: visa bekräftelsesida (ingen skrivning sker på GET).
router.get(
  "/party-submissions/review",
  async (req, res): Promise<void> => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const submission = await findReviewSubmission(token);
    if (!submission) {
      res.status(404).send(reviewPage("<p>Länken är ogiltig eller redan använd.</p>"));
      return;
    }
    if (submission.status !== "pending_review") {
      res.status(200).send(
        reviewPage(`<p>Det här inskicket är redan hanterat (${submission.status === "approved" ? "godkänt" : "avvisat"}).</p>`),
      );
      return;
    }
    const [party] = await db
      .select()
      .from(partiesTable)
      .where(eq(partiesTable.id, submission.partyId));
    const answered = Object.values(submission.answers).filter((v) => v != null).length;
    const answerList = Object.entries(submission.answers)
      .map(([qid, v]) => `<li>${escapeHtml(qid)}: ${v == null ? "hoppar över" : v}</li>`)
      .join("");
    res.status(200).send(
      reviewPage(`<p><strong>${escapeHtml(party?.name ?? submission.partyId)}</strong> — ${answered} besvarade frågor.</p>
<p>Avsändare: ${escapeHtml(submission.contactName ?? "okänd")} &lt;${escapeHtml(submission.contactEmail)}&gt;<br>
Partiets webbplats: ${escapeHtml(party?.website ?? "saknas")}</p>
<ul style="font-size:0.85rem;color:#555">${answerList}</ul>
<form method="post" style="display:inline"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="action" value="approve"><button type="submit" style="padding:0.5rem 1rem">✅ Godkänn svaren</button></form>
<form method="post" style="display:inline;margin-left:0.5rem"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="action" value="reject"><button type="submit" style="padding:0.5rem 1rem">❌ Avvisa svaren</button></form>`),
    );
  },
);

// POST: utför godkännande/avvisning.
router.post(
  "/party-submissions/review",
  async (req, res): Promise<void> => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const action = req.body?.action;
    if (!token || (action !== "approve" && action !== "reject")) {
      res.status(400).send(reviewPage("<p>Ogiltig begäran.</p>"));
      return;
    }
    const submission = await findReviewSubmission(token);
    if (!submission) {
      res.status(404).send(reviewPage("<p>Länken är ogiltig eller redan använd.</p>"));
      return;
    }
    // Atomisk statusövergång skyddar mot dubbelklick/race.
    const [claimed] = await db
      .update(partySubmissionsTable)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(partySubmissionsTable.id, submission.id),
          eq(partySubmissionsTable.status, "pending_review"),
        ),
      )
      .returning();
    if (!claimed) {
      res.status(200).send(
        reviewPage(`<p>Det här inskicket är redan hanterat (${submission.status === "approved" ? "godkänt" : "avvisat"}).</p>`),
      );
      return;
    }
    if (action === "approve") {
      await applySubmission(claimed);
      res.status(200).send(reviewPage("<p>Svaren är godkända och publicerade. ✅</p>"));
    } else {
      res.status(200).send(reviewPage("<p>Svaren är avvisade och publiceras inte. ❌</p>"));
    }
  },
);

export default router;
