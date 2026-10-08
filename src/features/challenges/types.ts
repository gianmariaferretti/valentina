import {
  EMPTY_GAME_PROGRESS_STATE,
  type GameProgress,
  type GameProgressState,
} from "@/features/games/types";

export type GameDirection = "up" | "down" | "left" | "right";

export type ChallengeProgress = GameProgress;
export type ChallengeProgressState = GameProgressState;

export const EMPTY_CHALLENGE_PROGRESS_STATE = EMPTY_GAME_PROGRESS_STATE;
