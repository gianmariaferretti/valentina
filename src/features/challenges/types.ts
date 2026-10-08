import {
  EMPTY_GAME_PROGRESS_STATE,
  type GameProgress,
  type GameProgressState,
} from "@/features/games/types";

export type ArcadeGameKind = "snake" | "maze";
export type GameDirection = "up" | "down" | "left" | "right";

interface BaseChallengeDefinition {
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly format: string;
}

export interface ArcadeChallengeDefinition extends BaseChallengeDefinition {
  readonly kind: ArcadeGameKind;
  readonly requiredScore: number;
  readonly scoreStep: number;
  readonly rewardCouponId: string;
  readonly reward: string;
  readonly difficulty: "extreme" | "practically-impossible";
  readonly accent: "acid" | "cyan";
  readonly instructions: readonly string[];
}

export interface PlaceholderChallengeDefinition extends BaseChallengeDefinition {
  readonly kind: "placeholder";
}

export type ChallengeDefinition =
  ArcadeChallengeDefinition | PlaceholderChallengeDefinition;

export type ChallengeProgress = GameProgress;
export type ChallengeProgressState = GameProgressState;

export const EMPTY_CHALLENGE_PROGRESS_STATE = EMPTY_GAME_PROGRESS_STATE;
