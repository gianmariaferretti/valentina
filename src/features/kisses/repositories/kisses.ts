import "server-only";

import { cache } from "react";

import { getOpenWhenLetter } from "@/data/open-when";
import { vgGames } from "@/data/games";
import type { KissRewardAmounts } from "@/data/kiss-rewards";
import { loadSetting } from "@/features/admin/repositories/content";
import { createInitialState } from "@/features/casino/lib/engine";
import type { Json } from "@/lib/supabase/database.types";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import {
  EVENT_KEY,
  placeCredit,
  planCredits,
  prettify,
  resolveAmounts,
  type PlannedCredit,
  type ProgressSnapshot,
} from "../lib/rewards";

export const KISS_SETTING_KEY = "kiss-rewards";

export const loadKissAmounts = cache(async (): Promise<KissRewardAmounts> =>
  resolveAmounts(await loadSetting(KISS_SETTING_KEY).catch(() => null)),
);

/**
 * Credits one event, once ever (the database refuses the same key twice).
 * Returns the new casino balance, or null if it had already been paid.
 */
export async function creditSiteKisses(
  credit: PlannedCredit,
): Promise<number | null> {
  if (!EVENT_KEY.test(credit.key)) throw new Error("Invalid kiss event key.");
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("credit_site_kisses", {
    p_user_id: userId,
    p_key: credit.key,
    p_amount: credit.amount,
    p_label: credit.label,
    p_initial_state: createInitialState() as unknown as Json,
  });
  assertSupabaseResult("Unable to credit kisses.", error);
  return typeof data === "number" ? data : null;
}

const gameTitles = new Map<string, string>(
  vgGames.map((game) => [game.gameId, game.title]),
);

const examTitles: Record<string, string> = {
  italian: "The Italian Challenge",
  gianmaria: "The Gianmaria exam",
};

/** Reads what Valentina has done so far from the progress tables. */
async function loadProgressSnapshot(): Promise<ProgressSnapshot> {
  const { client, userId } = getSupabaseServerContext();
  const [games, quiz, lessons, levels, corner, achievements, letters, bucket] =
    await Promise.all([
      client
        .from("challenge_scores")
        .select("challenge_id")
        .eq("user_id", userId)
        .gt("wins", 0),
      client
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .limit(1),
      client
        .from("italian_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("status", "completed"),
      client
        .from("italian_level_exams")
        .select("level")
        .eq("user_id", userId)
        .eq("passed", true),
      client
        .from("italian_corner_attempts")
        .select("quiz_id")
        .eq("user_id", userId)
        .eq("passed", true),
      client
        .from("achievements")
        .select("achievement_id")
        .eq("user_id", userId),
      client
        .from("letter_state")
        .select("letter_slug")
        .eq("user_id", userId)
        .not("opened_at", "is", null),
      client
        .from("life_lists")
        .select("id, title, reward")
        .eq("list", "bucket")
        .not("rewarded_at", "is", null),
    ]);
  for (const result of [
    games,
    quiz,
    lessons,
    levels,
    corner,
    achievements,
    letters,
    bucket,
  ])
    assertSupabaseResult("Unable to read progress for kisses.", result.error);

  const exams = [...new Set((corner.data ?? []).map((row) => row.quiz_id))].map(
    (id) => ({ id, title: examTitles[id] ?? prettify(id) }),
  );
  for (const row of levels.data ?? [])
    exams.push({
      id: `level-${row.level}`,
      title: `The ${String(row.level).toUpperCase()} exam`,
    });

  return {
    gameWins: (games.data ?? []).map((row) => ({
      id: row.challenge_id,
      title: gameTitles.get(row.challenge_id) ?? prettify(row.challenge_id),
    })),
    quizCompleted: (quiz.data ?? []).length > 0,
    lessons: (lessons.data ?? []).map((row) => row.lesson_id),
    exams,
    achievements: (achievements.data ?? []).map((row) => ({
      id: row.achievement_id,
      title: prettify(row.achievement_id),
    })),
    letters: (letters.data ?? []).map((row) => ({
      slug: row.letter_slug,
      title:
        getOpenWhenLetter(row.letter_slug)?.title ?? prettify(row.letter_slug),
    })),
    bucket: (bucket.data ?? []).flatMap((row) => {
      const kisses =
        row.reward && typeof row.reward === "object" && "kisses" in row.reward
          ? Number((row.reward as { kisses: unknown }).kisses)
          : NaN;
      return Number.isInteger(kisses)
        ? [{ id: row.id, title: row.title, kisses }]
        : [];
    }),
  };
}

/**
 * Pays every event not paid yet. Safe to call often and concurrently: the
 * unique key in the database makes each credit happen once.
 */
export async function syncSiteKisses(): Promise<number> {
  const { client, userId } = getSupabaseServerContext();
  const [progress, amounts, paid] = await Promise.all([
    loadProgressSnapshot(),
    loadKissAmounts(),
    client.from("kiss_credits").select("event_key").eq("user_id", userId),
  ]);
  assertSupabaseResult("Unable to read kiss credits.", paid.error);
  const plan = planCredits(
    progress,
    amounts,
    new Set((paid.data ?? []).map((row) => row.event_key)),
  );
  let credited = 0;
  for (const credit of plan) {
    // One at a time: each call also updates the casino balance.
    if ((await creditSiteKisses(credit)) !== null) credited += 1;
  }
  return credited;
}

/** Credits not shown yet; marks them as shown. */
export async function takeKissAnnouncements(): Promise<
  { key: string; amount: number; label: string }[]
> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("take_kiss_announcements", {
    p_user_id: userId,
  });
  assertSupabaseResult("Unable to read kiss announcements.", error);
  return (data ?? [])
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((row) => ({
      key: row.event_key,
      amount: row.amount,
      label: row.label,
    }));
}

export interface KissCreditRow {
  readonly key: string;
  readonly amount: number;
  readonly label: string;
  readonly at: string;
}

/** For the control panel. */
export async function loadRecentKissCredits(
  limit = 30,
): Promise<KissCreditRow[]> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client
    .from("kiss_credits")
    .select("event_key, amount, label, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  assertSupabaseResult("Unable to load kiss credits.", error);
  return (data ?? []).map((row) => ({
    key: row.event_key,
    amount: row.amount,
    label: row.label,
    at: row.created_at,
  }));
}

/** First visit to a place on the map (the credit is the record of the visit). */
export async function creditPlaceVisit(slug: string, city: string) {
  const credit = placeCredit(slug, city, await loadKissAmounts());
  if (credit) await creditSiteKisses(credit);
}
