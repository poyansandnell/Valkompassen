import { netLogText } from './netlog';

// Extracts a human-readable diagnostic string from a query error so failures
// can be understood directly on a device (e.g. in TestFlight) without a
// debugger attached. Shows the exact URL, HTTP status, error message, stack
// trace and the recent network log (including requests that never left the
// phone).
export function errorInfo(error: unknown): string {
  if (!error) return '';
  const e = error as {
    message?: string;
    status?: number;
    url?: string;
    stack?: string;
  };
  const parts: string[] = [];
  if (e.url) parts.push(`URL: ${e.url}`);
  if (typeof e.status === 'number') parts.push(`Status: ${e.status}`);
  if (e.message) parts.push(e.message);
  if (typeof e.stack === 'string') parts.push(e.stack.slice(0, 400));
  parts.push('— Nätverkslogg —');
  parts.push(netLogText());
  return parts.join('\n');
}
