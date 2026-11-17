/** Pure helpers for the "Next time" board. */

export interface Countdown {
  readonly totalMs: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  /** Less than one day to go: the page gets festive. */
  readonly almost: boolean;
  /** The moment has come: LANDED ❤️. */
  readonly landed: boolean;
}

export function countdownTo(at: string | null, now: number): Countdown | null {
  if (!at) return null;
  const target = new Date(at).getTime();
  if (Number.isNaN(target)) return null;
  const totalMs = Math.max(0, target - now);
  const s = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    almost: totalMs > 0 && totalMs < 86_400_000,
    landed: totalMs === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "Boarding in 12 days 04:32:10" */
export function boardingLine(c: Countdown): string {
  if (c.landed) return "LANDED ❤️";
  const days = c.days === 1 ? "1 day" : `${c.days} days`;
  return `Boarding in ${days} ${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
}

/** The Apart wallet's "I'm Coming to You" glows during the final week. */
export function inFinalWeek(at: string | null, now: number): boolean {
  const c = countdownTo(at, now);
  return Boolean(c && !c.landed && c.totalMs <= 7 * 86_400_000);
}
