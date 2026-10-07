import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";

export function getChallengeProgress(
  challengeId: string,
  state: ChallengeProgressState,
): ChallengeProgress {
  return (
    state.challenges.find(
      (challenge) => challenge.challengeId === challengeId,
    ) ?? {
      challengeId,
      bestScore: 0,
      attempts: 0,
      completedAt: null,
    }
  );
}
