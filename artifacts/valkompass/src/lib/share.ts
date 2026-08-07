/**
 * Robust delning: försök med webbläsarens delningsmeny, annars kopiera
 * länken. Fungerar även i inbäddade förhandsvisningar där både
 * navigator.share och clipboard-API:t kan vara blockerade.
 */
/**
 * Kanonisk adress att dela: i produktion alltid valkompassen.org,
 * oavsett vilken adress besökaren råkar använda (t.ex. *.replit.app).
 */
export function canonicalOrigin(): string {
  return import.meta.env.PROD ? 'https://valkompassen.org' : window.location.origin;
}

/** Gör om nuvarande sida till en delbar länk på den kanoniska adressen. */
export function canonicalUrl(pathname?: string): string {
  return canonicalOrigin() + (pathname ?? window.location.pathname);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback för miljöer utan clipboard-behörighet (t.ex. iframes).
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Returnerar 'shared' om delningsmenyn öppnades, 'copied' om länken
 * kopierades, 'failed' om inget gick.
 */
export async function shareOrCopy(opts: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share(opts);
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Användaren stängde delningsmenyn — inget fel.
        return 'shared';
      }
      // Blockerad (t.ex. i iframe) — falla vidare till kopiering.
    }
  }
  return (await copyText(opts.url)) ? 'copied' : 'failed';
}
