/** ISO datetime string without milliseconds, e.g. 2026-02-07T01:32:37Z */
export function toDatetimeString(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
