/** Pure helpers for the split-flap departures board on Next time. */

import type { Countdown } from "./countdown";

/** The drum of every flap, in order: a flap only moves forward through it. */
export const FLAP_DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-+.>❤";

/** At most this many flips per change, so long jumps stay quick. */
export const MAX_FLIPS = 7;

/**
 * The characters a flap shows on its way from `from` to `to`, ending on
 * `to`. A real flap rolls forward through the drum; long trips skip ahead
 * evenly so the last flips are always the ones next to the target.
 * Characters not on the drum (accents, emoji) arrive in one flip.
 */
export function flipPath(
  from: string,
  to: string,
  maxFlips = MAX_FLIPS,
): string[] {
  if (from === to) return [];
  const drum = [...FLAP_DRUM];
  const start = drum.indexOf(from);
  const end = drum.indexOf(to);
  if (start < 0 || end < 0) return [to];
  const distance = (end - start + drum.length) % drum.length;
  const flips = Math.min(distance, Math.max(1, maxFlips));
  const path: string[] = [];
  for (let i = 1; i <= flips; i++) {
    const offset = Math.round((distance * i) / flips);
    path.push(drum[(start + offset) % drum.length]);
  }
  return path;
}

/** Splits text into the characters a board shows (emoji stay whole). */
export function flapChars(text: string): string[] {
  return [...text.toUpperCase().replace(/\u{FE0F}/gu, "")];
}

export type PanelStatus = "on-time" | "delayed" | "boarding";

export type BoardStatus =
  | "SCHEDULED"
  | "ON TIME"
  | "MISSING YOU"
  | "ALMOST"
  | "LANDED ❤"
  | "DELAYED"
  | "NOW BOARDING";

/**
 * The joke on the status row: ON TIME while it is far away, MISSING YOU in
 * the last two weeks, ALMOST in the last two days, LANDED ❤ at the end.
 * A "delayed" or "boarding" set in the panel wins until the landing.
 */
export function boardStatus(
  countdown: Countdown | null,
  panel: PanelStatus,
): BoardStatus {
  if (countdown?.landed) return "LANDED ❤";
  if (panel === "delayed") return "DELAYED";
  if (panel === "boarding") return "NOW BOARDING";
  if (!countdown) return "SCHEDULED";
  if (countdown.days >= 14) return "ON TIME";
  if (countdown.days >= 2) return "MISSING YOU";
  return "ALMOST";
}

const two = (n: number) => String(n).padStart(2, "0");

/**
 * The BOARDING IN row: "12D 04H 32M" while there are days to go, then
 * "04:32:10" (seconds flipping) on the last day.
 */
export function boardingIn(countdown: Countdown | null): string {
  if (!countdown) return "TBA";
  if (countdown.landed) return "NOW";
  if (countdown.days > 0)
    return `${countdown.days}D ${two(countdown.hours)}H ${two(countdown.minutes)}M`;
  return `${two(countdown.hours)}:${two(countdown.minutes)}:${two(countdown.seconds)}`;
}

/** What a screen reader hears for the timer (minutes, not every second). */
export function boardingInSpoken(countdown: Countdown | null): string {
  if (!countdown) return "Boarding time to be announced";
  if (countdown.landed) return "Landed";
  const parts = [
    countdown.days
      ? `${countdown.days} ${countdown.days === 1 ? "day" : "days"}`
      : "",
    `${countdown.hours} ${countdown.hours === 1 ? "hour" : "hours"}`,
    `${countdown.minutes} ${countdown.minutes === 1 ? "minute" : "minutes"}`,
  ].filter(Boolean);
  return `Boarding in ${parts.join(", ")}`;
}
