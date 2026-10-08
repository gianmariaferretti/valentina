import "server-only";

import type {
  ChallengeResultInput,
  ChallengeStateRepository,
  GameRunFinishInput,
  GameRunStartInput,
  SavedChallengeResult,
  SavedGameRun,
} from "@/features/challenges/repositories/challenge-state-repository";
import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";
import type { GameDifficulty } from "@/features/games/types";
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
      .select(
        "challenge_id, best_score, latest_score, attempts, started_at, completed_at, duration_ms, difficulty, progress, ending, wins, losses, unlocked_rewards, discovered_secrets",
      )
      .eq("user_id", userId);

    assertSupabaseResult("Unable to load challenge scores.", error);

    return {
      version: 2,
      games: (data ?? []).map(mapGameProgress),
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
        gameId: saved.challenge_id,
        bestScore: saved.best_score,
        latestScore: input.score,
        attempts: saved.attempts,
        startedAt: null,
        completedAt: saved.completed_at,
        durationMs: 0,
        difficulty: "daring",
        progress: input.completed ? 100 : 0,
        ending: input.completed ? "legacy-complete" : "legacy-failed",
        wins: input.completed ? 1 : 0,
        losses: input.completed ? 0 : 1,
        unlockedRewards: [],
        discoveredSecrets: [],
      },
      couponUnlocked: saved.coupon_unlocked,
    };
  }

  async beginRun(input: GameRunStartInput): Promise<ChallengeProgress> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("begin_game_run", {
      p_run_id: input.runId,
      p_user_id: userId,
      p_game_id: input.gameId,
      p_difficulty: input.difficulty,
      p_started_at: input.startedAt,
    });

    assertSupabaseResult("Unable to begin game run.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Game run was not started.");
    return mapGameProgressFromFunction(saved);
  }

  async finishRun(input: GameRunFinishInput): Promise<SavedGameRun> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("finish_game_run", {
      p_run_id: input.runId,
      p_user_id: userId,
      p_game_id: input.gameId,
      p_score: input.score,
      p_duration_ms: input.durationMs,
      p_difficulty: input.difficulty,
      p_progress: input.progress,
      p_ending: input.ending,
      p_won: input.won,
      p_reward_grants: input.rewards.map((reward) => ({
        id: reward.id,
        kind: reward.kind,
        targetId: reward.targetId,
        title: reward.title,
      })),
      p_discovered_secrets: [...input.discoveredSecrets],
      p_finished_at: input.finishedAt,
    });

    assertSupabaseResult("Unable to finish game run.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Game run was not saved.");

    return {
      progress: mapGameProgressFromFunction(saved),
      newlyGrantedRewardIds: saved.newly_granted_reward_ids,
    };
  }
}

function normalizeDifficulty(value: string): GameDifficulty {
  return value === "story" || value === "daring" ? value : "standard";
}

function mapGameProgress(row: {
  challenge_id: string;
  best_score: number;
  latest_score: number;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number;
  difficulty: string;
  progress: number;
  ending: string | null;
  wins: number;
  losses: number;
  unlocked_rewards: string[];
  discovered_secrets: string[];
}): ChallengeProgress {
  return {
    gameId: row.challenge_id,
    bestScore: row.best_score,
    latestScore: row.latest_score,
    attempts: row.attempts,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    difficulty: normalizeDifficulty(row.difficulty),
    progress: row.progress,
    ending: row.ending,
    wins: row.wins,
    losses: row.losses,
    unlockedRewards: row.unlocked_rewards,
    discoveredSecrets: row.discovered_secrets,
  };
}

function mapGameProgressFromFunction(row: {
  game_id: string;
  best_score: number;
  latest_score: number;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number;
  difficulty: string;
  progress: number;
  ending: string | null;
  wins: number;
  losses: number;
  unlocked_rewards: string[];
  discovered_secrets: string[];
}): ChallengeProgress {
  return mapGameProgress({
    challenge_id: row.game_id,
    best_score: row.best_score,
    latest_score: row.latest_score,
    attempts: row.attempts,
    started_at: row.started_at,
    completed_at: row.completed_at,
    duration_ms: row.duration_ms,
    difficulty: row.difficulty,
    progress: row.progress,
    ending: row.ending,
    wins: row.wins,
    losses: row.losses,
    unlocked_rewards: row.unlocked_rewards,
    discovered_secrets: row.discovered_secrets,
  });
}
