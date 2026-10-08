import "server-only";

import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";
import type {
  GameDifficulty,
  GameRewardDefinition,
} from "@/features/games/types";

export interface GameRunStartInput {
  readonly runId: string;
  readonly gameId: string;
  readonly difficulty: GameDifficulty;
  readonly startedAt: string;
}

export interface GameRunFinishInput {
  readonly moves?: number;
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
  beginRun(input: GameRunStartInput): Promise<ChallengeProgress>;
  finishRun(input: GameRunFinishInput): Promise<SavedGameRun>;
}
