import "server-only";

import type {
  ChallengeStateRepository,
  GameRunFinishInput,
  GameRunStartInput,
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
        "challenge_id, best_score, latest_score, attempts, started_at, completed_at, duration_ms, difficulty, progress, ending, wins, losses, unlocked_rewards, discovered_secrets, best_time_ms, fewest_moves, last_result, last_played_at",
      )
      .eq("user_id", userId);

    assertSupabaseResult("Unable to load challenge scores.", error);

    return {
      version: 2,
      games: (data ?? []).map(mapGameProgress),
    };
  }

  async beginRun(input: GameRunStartInput): Promise<ChallengeProgress> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("begin_arcade_run", {
      p_run_id: input.runId,
      p_user_id: userId,
      p_game_id: input.gameId,
      p_difficulty: input.difficulty,
      p_started_at: input.startedAt,
    });

    assertSupabaseResult("Unable to begin game run.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Game run was not started.");
    return mapGameProgress(saved);
  }

  async finishRun(input: GameRunFinishInput): Promise<SavedGameRun> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("finish_arcade_run", {
      p_run_id: input.runId,
      p_user_id: userId,
      p_game_id: input.gameId,
      p_score: input.score,
      p_duration_ms: input.durationMs,
      ...(input.moves !== undefined ? { p_moves: input.moves } : {}),
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
  best_time_ms: number | null;
  fewest_moves: number | null;
  last_result: string | null;
  last_played_at: string | null;
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
    bestTimeMs: row.best_time_ms,
    fewestMoves: row.fewest_moves,
    lastResult: row.last_result,
    lastPlayedAt: row.last_played_at,
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
  best_time_ms: number | null;
  fewest_moves: number | null;
  last_result: string | null;
  last_played_at: string | null;
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
    best_time_ms: row.best_time_ms,
    fewest_moves: row.fewest_moves,
    last_result: row.last_result,
    last_played_at: row.last_played_at,
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
