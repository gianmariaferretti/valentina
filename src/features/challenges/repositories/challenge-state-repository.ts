import "server-only";

import type {
  ChallengeProgress,
  ChallengeProgressState,
} from "@/features/challenges/types";

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

export interface ChallengeStateRepository {
  get(): Promise<ChallengeProgressState>;
  recordResult(input: ChallengeResultInput): Promise<SavedChallengeResult>;
}
