import "server-only";

import type {
  ChallengeResultInput,
  ChallengeStateRepository,
  SavedChallengeResult,
} from "@/features/challenges/repositories/challenge-state-repository";
import type { ChallengeProgressState } from "@/features/challenges/types";
import { PersistenceError } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

export class SupabaseChallengeStateRepository implements ChallengeStateRepository {
  async get(): Promise<ChallengeProgressState> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("challenge_scores")
      .select("challenge_id, best_score, attempts, completed_at")
      .eq("user_id", userId);

    assertSupabaseResult("Unable to load challenge scores.", error);

    return {
      version: 1,
      challenges: (data ?? []).map((row) => ({
        challengeId: row.challenge_id,
        bestScore: row.best_score,
        attempts: row.attempts,
        completedAt: row.completed_at,
      })),
    };
  }

  async recordResult(
    input: ChallengeResultInput,
  ): Promise<SavedChallengeResult> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("record_challenge_result", {
      p_user_id: userId,
      p_challenge_id: input.challengeId,
      p_score: input.score,
      p_completed: input.completed,
      p_reward_coupon_id: input.rewardCouponId,
      p_recorded_at: input.recordedAt,
    });

    assertSupabaseResult("Unable to save challenge score.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Challenge score was not saved.");

    return {
      progress: {
        challengeId: saved.challenge_id,
        bestScore: saved.best_score,
        attempts: saved.attempts,
        completedAt: saved.completed_at,
      },
      couponUnlocked: saved.coupon_unlocked,
    };
  }
}
