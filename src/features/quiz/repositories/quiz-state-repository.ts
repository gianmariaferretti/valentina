import "server-only";

import type { ActiveQuizAttempt, QuizState } from "@/features/quiz/types";

export interface CompleteQuizAttemptInput {
  readonly attempt: ActiveQuizAttempt;
  readonly score: number;
  readonly completedAt: string;
  readonly achievementId: string | null;
  readonly rewardId: string | null;
  readonly rewardCouponId: string | null;
}

export interface CompleteQuizAttemptResult {
  readonly achievementWasNew: boolean;
  readonly rewardWasNew: boolean;
}

export interface QuizStateRepository {
  get(): Promise<QuizState>;
  startAttempt(attempt: ActiveQuizAttempt): Promise<void>;
  saveAnswer(attempt: ActiveQuizAttempt): Promise<void>;
  completeAttempt(
    input: CompleteQuizAttemptInput,
  ): Promise<CompleteQuizAttemptResult>;
}
