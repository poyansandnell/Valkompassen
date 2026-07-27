// On-device network + JS error log. Patches global fetch so that EVERY
// request is recorded: exact URL, HTTP status, response body on errors,
// and network errors that never leave the phone (DNS, TLS, timeout).
// The log is shown on error screens so failures can be diagnosed in
// TestFlight without a debugger.

type Entry = {
  ts: number;
  kind: 'net' | 'js' | 'step';
  method?: string;
  url?: string;
  status?: number;
  body?: string;
  error?: string;
  ms?: number;
};

const entries: Entry[] = [];
let apiDomain = '(okänd)';
let patched = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Subscribe to log changes (used by the debug overlay). Returns unsubscribe. */
export function subscribeNetLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function push(e: Entry) {
  entries.push(e);
  if (entries.length > 80) entries.shift();
  notify();
}

/** Log an arbitrary flow step (button press, query status, render, state). */
export function logStep(msg: string): void {
  push({ ts: Date.now(), kind: 'step', error: msg });
  console.log(`[STEG] ${msg}`);
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

export function getApiDomain(): string {
  return apiDomain;
}

/** Full log, newest last — used by the debug overlay. */
export function fullLogLines(): string[] {
  return entries.map((e) => {
    const t = fmtTime(e.ts);
    if (e.kind === 'step') return `${t} ${e.error}`;
    if (e.kind === 'js') return `${t} JS-FEL: ${e.error}`;
    const outcome =
      e.status != null
        ? `→ ${e.status}`
        : `→ NÄTVERKSFEL (lämnade ev. aldrig telefonen): ${e.error}`;
    return `${t} ${e.method} ${e.url} ${outcome} (${e.ms} ms)${e.body ? `\nSvar: ${e.body}` : ''}`;
  });
}

export function netLogText(): string {
  return [`API-domän i denna build: ${apiDomain}`, ...fullLogLines().slice(-8)].join('\n');
}

export function installNetLog(domain: string): void {
  apiDomain = domain;
  if (patched) return;
  patched = true;

  const origFetch = global.fetch;
  global.fetch = async (input: any, init?: any) => {
    const url =
      typeof input === 'string' ? input : (input?.url ?? String(input));
    const method = (init?.method ?? input?.method ?? 'GET').toUpperCase();
    const start = Date.now();
    push({ ts: start, kind: 'step', error: `fetch START ${method} ${url}` });
    try {
      const res = await origFetch(input, init);
      const entry: Entry = {
        ts: start,
        kind: 'net',
        method,
        url,
        status: res.status,
        ms: Date.now() - start,
      };
      if (!res.ok) {
        try {
          entry.body = (await res.clone().text()).slice(0, 300);
        } catch {
          entry.body = '(kunde inte läsa svaret)';
        }
      }
      push(entry);
      console.log(`[NET] ${method} ${url} → ${res.status} (${entry.ms} ms)`);
      return res;
    } catch (err: any) {
      const msg = `${err?.name ?? 'Error'}: ${err?.message ?? String(err)}`;
      const stack = typeof err?.stack === 'string' ? `\n${err.stack.slice(0, 400)}` : '';
      push({ ts: start, kind: 'net', method, url, error: msg + stack, ms: Date.now() - start });
      console.log(`[NET-FEL] ${method} ${url} → ${msg}`);
      throw err;
    }
  };

  // Capture uncaught JS errors (with stack trace) as well.
  const g = global as any;
  if (g.ErrorUtils?.setGlobalHandler) {
    const prev = g.ErrorUtils.getGlobalHandler?.();
    g.ErrorUtils.setGlobalHandler((e: any, isFatal?: boolean) => {
      const stack = typeof e?.stack === 'string' ? `\n${e.stack.slice(0, 500)}` : '';
      push({ ts: Date.now(), kind: 'js', error: `${e?.message ?? String(e)}${stack}` });
      prev?.(e, isFatal);
    });
  }
}
