import "server-only";

import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";
import type {
  GameDifficulty,
  GameRewardDefinition,
} from "@/features/games/types";

export interface ChallengeResultInput {
  readonly challengeId: string;
  readonly score: number;
  readonly completed: boolean;
  readonly rewardCouponId: string;
  readonly recordedAt: string;
}

export interface SavedChallengeResult {
  readonly progress: ChallengeProgress;
  readonly couponUnlocked: boolean;
}

export interface GameRunStartInput {
  readonly runId: string;
  readonly gameId: string;
  readonly difficulty: GameDifficulty;
  readonly startedAt: string;
}

export interface GameRunFinishInput {
  readonly runId: string;
  readonly gameId: string;
  readonly score: number;
  readonly durationMs: number;
  readonly difficulty: GameDifficulty;
  readonly progress: number;
  readonly ending: string;
  readonly won: boolean;
  readonly rewards: readonly GameRewardDefinition[];
  readonly discoveredSecrets: readonly string[];
  readonly finishedAt: string;
}

export interface SavedGameRun {
  readonly progress: ChallengeProgress;
  readonly newlyGrantedRewardIds: readonly string[];
}

export interface ChallengeStateRepository {
  get(): Promise<ChallengeProgressState>;
  recordResult(input: ChallengeResultInput): Promise<SavedChallengeResult>;
  beginRun(input: GameRunStartInput): Promise<ChallengeProgress>;
  finishRun(input: GameRunFinishInput): Promise<SavedGameRun>;
}
