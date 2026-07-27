// Extracts a short, human-readable diagnostic string from a query error so
// failures can be understood directly on a device (e.g. in TestFlight)
// without a debugger attached. Shows the exact URL that was called.
export function errorInfo(error: unknown): string {
  if (!error) return '';
  const e = error as {
    message?: string;
    status?: number;
    url?: string;
  };
  const parts: string[] = [];
  if (e.url) parts.push(`URL: ${e.url}`);
  if (typeof e.status === 'number') parts.push(`Status: ${e.status}`);
  if (e.message) parts.push(e.message);
  return parts.join('\n');
}
