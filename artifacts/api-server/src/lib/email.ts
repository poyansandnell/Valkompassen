import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

const FROM = process.env.EMAIL_FROM ?? "Valkompass <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`E-postutskick misslyckades (${response.status}): ${body}`);
  }
}

// Publik bas-URL för länkar i mejl. I produktion sätts REPLIT_DOMAINS till
// den publicerade domänen; i utvecklingsmiljön är det dev-domänen.
export function publicOrigin(): string {
  const explicit = process.env.PUBLIC_WEB_ORIGIN;
  if (explicit) return explicit.replace(/\/+$/, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return "http://localhost";
}
