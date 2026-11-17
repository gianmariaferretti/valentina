import { z } from "zod";

import {
  kissRewardDefaults,
  MAX_KISS_REWARD,
  type KissRewardAmounts,
  type KissRewardKind,
} from "../../../data/kiss-rewards.ts";

/** Same rule as the database check on kiss_credits.event_key. */
export const EVENT_KEY = /^[a-z0-9-]{1,30}:[A-Za-z0-9._:-]{1,120}$/;

const amount = z.coerce.number().int().min(0).max(MAX_KISS_REWARD);

export const kissAmountsSchema = z.object(
  Object.fromEntries(
    Object.keys(kissRewardDefaults).map((key) => [key, amount]),
  ) as Record<KissRewardKind, typeof amount>,
);

/** Panel overrides on top of the defaults; anything invalid is ignored. */
export function resolveAmounts(raw: unknown): KissRewardAmounts {
  const merged: KissRewardAmounts = { ...kissRewardDefaults };
  if (!raw || typeof raw !== "object") return merged;
  for (const key of Object.keys(merged) as KissRewardKind[]) {
    const parsed = amount.safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) merged[key] = parsed.data;
  }
  return merged;
}

/** What the site has done so far, read from the progress tables. */
export interface ProgressSnapshot {
  readonly gameWins: readonly { id: string; title: string }[];
  readonly quizCompleted: boolean;
  readonly lessons: readonly string[];
  readonly exams: readonly { id: string; title: string }[];
  readonly achievements: readonly { id: string; title: string }[];
  readonly letters: readonly { slug: string; title: string }[];
  readonly bucket: readonly { id: string; title: string; kisses: number }[];
}

export interface PlannedCredit {
  readonly key: string;
  readonly amount: number;
  readonly label: string;
}

const clip = (text: string, max = 160) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** Readable title from an id: "defence-breaker" → "Defence breaker". */
export function prettify(id: string): string {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : id;
}

/** Key segment safe for the database rule (ids are already slug-like). */
export function keyPart(id: string): string {
  return id.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 120);
}

export function placeCredit(
  slug: string,
  city: string,
  amounts: KissRewardAmounts,
): PlannedCredit | null {
  if (amounts.placeFirstOpen <= 0) return null;
  return {
    key: `place:${keyPart(slug)}`,
    amount: amounts.placeFirstOpen,
    label: clip(`First time in ${city} (on the map, for now)`),
  };
}

/**
 * Every credit the progress deserves that has not been paid yet. Pure: the
 * database still refuses a key twice, this only avoids useless calls.
 */
export function planCredits(
  progress: ProgressSnapshot,
  amounts: KissRewardAmounts,
  alreadyPaid: ReadonlySet<string>,
): PlannedCredit[] {
  const plan: PlannedCredit[] = [];
  const add = (key: string, value: number, label: string) => {
    if (value > 0 && EVENT_KEY.test(key) && !alreadyPaid.has(key))
      plan.push({ key, amount: value, label: clip(label) });
  };
  for (const game of progress.gameWins)
    add(
      `game:${keyPart(game.id)}`,
      amounts.gameWin,
      `You beat ${game.title}. The arcade pays in kisses.`,
    );
  if (progress.quizCompleted)
    add("quiz:first", amounts.quizComplete, "Quiz survived. He's impressed.");
  for (const lesson of progress.lessons)
    add(
      `lesson:${keyPart(lesson)}`,
      amounts.lessonComplete,
      "Lezione finita. Bravissima!",
    );
  for (const exam of progress.exams)
    add(
      `exam:${keyPart(exam.id)}`,
      amounts.examPassed,
      `${exam.title} passed. Promossa!`,
    );
  for (const achievement of progress.achievements)
    add(
      `achievement:${keyPart(achievement.id)}`,
      amounts.achievement,
      `Achievement unlocked: ${achievement.title}`,
    );
  for (const letter of progress.letters)
    add(
      `letter:${keyPart(letter.slug)}`,
      amounts.letterFirstOpen,
      `Opened “${letter.title}”`,
    );
  // Bucket list: the amount was chosen per item in the panel.
  for (const item of progress.bucket)
    if (item.kisses >= 1 && item.kisses <= 100_000)
      add(`bucket:${item.id}`, item.kisses, `Bucket list: ${item.title}`);
  return plan;
}

/** One toast for a few credits; one summary toast for a backlog. */
export function toastLines(
  credits: readonly { amount: number; label: string }[],
): { title: string; amount: number }[] {
  if (credits.length <= 3)
    return credits.map((c) => ({ title: c.label, amount: c.amount }));
  const total = credits.reduce((sum, c) => sum + c.amount, 0);
  return [
    {
      title: `${credits.length} things you did, finally paid. The casino says thank you.`,
      amount: total,
    },
  ];
}
