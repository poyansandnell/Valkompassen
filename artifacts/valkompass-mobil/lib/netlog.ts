// On-device network + JS error log. Patches global fetch so that EVERY
// request is recorded: exact URL, HTTP status, response body on errors,
// and network errors that never leave the phone (DNS, TLS, timeout).
// The log is shown on error screens so failures can be diagnosed in
// TestFlight without a debugger.

type Entry = {
  ts: number;
  kind: 'net' | 'js';
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

function push(e: Entry) {
  entries.push(e);
  if (entries.length > 30) entries.shift();
}

export function netLogText(): string {
  const lines = entries.slice(-6).map((e) => {
    if (e.kind === 'js') return `JS-FEL: ${e.error}`;
    const outcome =
      e.status != null ? `→ ${e.status}` : `→ NÄTVERKSFEL (lämnade ev. aldrig telefonen): ${e.error}`;
    return `${e.method} ${e.url} ${outcome} (${e.ms} ms)${e.body ? `\nSvar: ${e.body}` : ''}`;
  });
  return [`API-domän i denna build: ${apiDomain}`, ...lines].join('\n');
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
