import { Router, type IRouter } from "express";
import { db, supportMessagesTable } from "@workspace/db";
import { CreateSupportMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Enkel skydd mot spam: max 5 meddelanden per IP per timme (i minnet).
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const recentByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recentByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT) {
    recentByIp.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  recentByIp.set(ip, timestamps);
  // Håll kartan liten
  if (recentByIp.size > 10000) recentByIp.clear();
  return false;
}

router.post("/support-messages", async (req, res): Promise<void> => {
  // Honeypot: fältet "website" är osynligt i formuläret — bara robotar fyller i det.
  if (typeof req.body?.website === "string" && req.body.website.length > 0) {
    res.status(201).json({ message: "Tack! Vi återkommer så snart vi kan." });
    return;
  }
  const ip = req.ip ?? "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ message: "För många meddelanden. Försök igen senare." });
    return;
  }
  const parsed = CreateSupportMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Ogiltiga uppgifter" });
    return;
  }
  const { name, email, message } = parsed.data;
  if (message.trim().length < 10) {
    res.status(400).json({ message: "Meddelandet är för kort" });
    return;
  }
  await db.insert(supportMessagesTable).values({
    name: name?.trim() || null,
    email: email?.trim() || null,
    message: message.trim(),
  });
  res.status(201).json({ message: "Tack! Vi återkommer så snart vi kan." });
});

export default router;
