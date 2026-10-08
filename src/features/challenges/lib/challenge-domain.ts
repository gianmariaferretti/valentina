import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";
import type { GameDifficulty } from "@/features/games/types";

export function createEmptyGameProgress(
  gameId: string,
  difficulty: GameDifficulty = "standard",
): ChallengeProgress {
  return {
    gameId,
    bestScore: 0,
    latestScore: 0,
    attempts: 0,
    startedAt: null,
    completedAt: null,
    durationMs: 0,
    difficulty,
    progress: 0,
    ending: null,
    wins: 0,
    losses: 0,
    unlockedRewards: [],
    discoveredSecrets: [],
  };
}

export function getChallengeProgress(
  challengeId: string,
  state: ChallengeProgressState,
  difficulty: GameDifficulty = "standard",
): ChallengeProgress {
  return (
    state.games.find((challenge) => challenge.gameId === challengeId) ??
    createEmptyGameProgress(challengeId, difficulty)
  );
}
