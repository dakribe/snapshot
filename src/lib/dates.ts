/** Calendar-date helpers. Game days are plain YYYY-MM-DD strings. */

export function isDay(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
}

/** Noon UTC, so adding days never crosses a daylight-saving edge. */
const at = (day: string) => new Date(`${day}T12:00:00Z`);

export function addDays(day: string, n: number): string {
  const d = at(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Today's date in a time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Format a calendar date (not an instant), e.g. { weekday: "short" } → "Sat". */
export function formatDay(day: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(at(day));
}
