import "server-only";

import type {
  CompleteQuizAttemptInput,
  CompleteQuizAttemptResult,
  QuizStateRepository,
} from "@/features/quiz/repositories/quiz-state-repository";
import type {
  ActiveQuizAttempt,
  QuizAnswerRecord,
  QuizState,
} from "@/features/quiz/types";
import { PersistenceError } from "@/lib/persistence/persistence-error";
import type { Json } from "@/lib/supabase/database.types";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

function parseAnswers(value: Json): readonly QuizAnswerRecord[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") return [];
    const answer = item as Record<string, Json | undefined>;
    return typeof answer.questionId === "string" &&
      typeof answer.answerId === "string" &&
      typeof answer.correct === "boolean"
      ? [
          {
            questionId: answer.questionId,
            answerId: answer.answerId,
            correct: answer.correct,
          },
        ]
      : [];
  });
}

function serializeAnswers(answers: readonly QuizAnswerRecord[]): Json {
  return answers.map((answer) => ({ ...answer }));
}

export class SupabaseQuizStateRepository implements QuizStateRepository {
  async get(): Promise<QuizState> {
    const { client, userId } = getSupabaseServerContext();
    const [attemptsResult, achievementsResult, rewardsResult] =
      await Promise.all([
        client
          .from("quiz_attempts")
          .select("id, status, started_at, score, answers")
          .eq("user_id", userId)
          .order("started_at", { ascending: false }),
        client
          .from("achievements")
          .select("achievement_id")
          .eq("user_id", userId),
        client
          .from("discoveries")
          .select("discovery_id")
          .eq("user_id", userId)
          .eq("discovery_type", "reward"),
      ]);

    assertSupabaseResult("Unable to load quiz attempts.", attemptsResult.error);
    assertSupabaseResult(
      "Unable to load achievements.",
      achievementsResult.error,
    );
    assertSupabaseResult("Unable to load quiz rewards.", rewardsResult.error);

    const attempts = attemptsResult.data ?? [];
    const completed = attempts.filter(
      (attempt) => attempt.status === "completed",
    );
    const active = attempts.find((attempt) => attempt.status === "active");

    return {
      version: 1,
      bestScore: completed.reduce(
        (best, attempt) => Math.max(best, attempt.score ?? 0),
        0,
      ),
      attempts: completed.length,
      unlockedAchievementIds: (achievementsResult.data ?? []).map(
        (row) => row.achievement_id,
      ),
      claimedRewardIds: (rewardsResult.data ?? []).map(
        (row) => row.discovery_id,
      ),
      activeAttempt: active
        ? {
            id: active.id,
            startedAt: active.started_at,
            answers: parseAnswers(active.answers).slice(0, 10),
          }
        : null,
    };
  }

  async startAttempt(attempt: ActiveQuizAttempt): Promise<void> {
    const { client, userId } = getSupabaseServerContext();
    const abandonedAt = new Date().toISOString();
    const { error: abandonError } = await client
      .from("quiz_attempts")
      .update({ status: "abandoned", updated_at: abandonedAt })
      .eq("user_id", userId)
      .eq("status", "active");
    assertSupabaseResult("Unable to archive the previous quiz.", abandonError);

    const { error: insertError } = await client.from("quiz_attempts").insert({
      user_id: userId,
      id: attempt.id,
      status: "active",
      started_at: attempt.startedAt,
      answers: serializeAnswers(attempt.answers),
    });
    assertSupabaseResult("Unable to start quiz attempt.", insertError);
    await this.touch(attempt.startedAt);
  }

  async saveAnswer(attempt: ActiveQuizAttempt): Promise<void> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("quiz_attempts")
      .update({ answers: serializeAnswers(attempt.answers) })
      .eq("user_id", userId)
      .eq("id", attempt.id)
      .eq("status", "active")
      .select("id");

    assertSupabaseResult("Unable to save quiz answer.", error);
    if (!data?.length) throw new PersistenceError("Quiz attempt has expired.");
    await this.touch(new Date().toISOString());
  }

  async completeAttempt(
    input: CompleteQuizAttemptInput,
  ): Promise<CompleteQuizAttemptResult> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("complete_quiz_attempt", {
      p_user_id: userId,
      p_attempt_id: input.attempt.id,
      p_answers: serializeAnswers(input.attempt.answers),
      p_score: input.score,
      p_completed_at: input.completedAt,
      p_achievement_id: input.achievementId ?? undefined,
      p_reward_id: input.rewardId ?? undefined,
      p_reward_coupon_id: input.rewardCouponId ?? undefined,
    });

    assertSupabaseResult("Unable to complete quiz attempt.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Quiz result was not saved.");

    return {
      achievementWasNew: saved.achievement_was_new,
      rewardWasNew: saved.reward_was_new,
    };
  }

  private async touch(visitedAt: string): Promise<void> {
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client
      .from("site_progress")
      .upsert(
        { user_id: userId, last_visited_at: visitedAt },
        { onConflict: "user_id" },
      );
    assertSupabaseResult("Unable to update site progress.", error);
  }
}
