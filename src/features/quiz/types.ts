import type { GrantedExperienceReward } from "@/features/rewards/types";

export interface QuizOption {
  readonly id: string;
  readonly label: string;
}

export interface QuizAnswerFeedback {
  readonly correct: string;
  readonly incorrect: string;
}

/** Full server-side question definition. Never pass this shape to the client. */
export interface QuizQuestion {
  readonly id: string;
  readonly eyebrow: string;
  readonly prompt: string;
  readonly options: readonly QuizOption[];
  readonly correctOptionId: string;
  readonly feedback: QuizAnswerFeedback;
}

/** Safe presentation shape with answer keys and feedback removed. */
export type QuizQuestionView = Pick<
  QuizQuestion,
  "id" | "eyebrow" | "prompt" | "options"
>;

export interface QuizResultBand {
  readonly id: string;
  readonly minScore: number;
  readonly maxScore: number;
  readonly title: string;
  readonly description: string;
  readonly sticker: string;
}

export interface QuizAchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface QuizAchievementRule {
  readonly kind: "achievement";
  readonly threshold: number;
  readonly achievement: QuizAchievementDefinition;
}

export interface QuizCouponRewardRule {
  readonly kind: "coupon";
  readonly threshold: number;
  readonly rewardId: string;
}

export type QuizRewardRule = QuizAchievementRule | QuizCouponRewardRule;

export interface QuizAnswerRecord {
  readonly questionId: string;
  readonly answerId: string;
  readonly correct: boolean;
}

export interface ActiveQuizAttempt {
  readonly id: string;
  readonly startedAt: string;
  readonly answers: readonly QuizAnswerRecord[];
}

export interface QuizState {
  readonly version: 1;
  readonly bestScore: number;
  readonly attempts: number;
  readonly unlockedAchievementIds: readonly string[];
  readonly claimedRewardIds: readonly string[];
  readonly activeAttempt: ActiveQuizAttempt | null;
}

export interface QuizPersistentStats {
  readonly bestScore: number;
  readonly attempts: number;
  readonly achievementUnlocked: boolean;
  readonly rewardClaimed: boolean;
}

export interface QuizAchievementGrant extends QuizAchievementDefinition {
  readonly newlyGranted: boolean;
}

export interface QuizCompletion {
  readonly score: number;
  readonly totalQuestions: number;
  readonly bestScore: number;
  readonly attempts: number;
  readonly result: QuizResultBand;
  readonly achievement: QuizAchievementGrant | null;
  readonly reward: GrantedExperienceReward | null;
  readonly rewardClaimed: boolean;
}

export const EMPTY_QUIZ_STATE: QuizState = {
  version: 1,
  bestScore: 0,
  attempts: 0,
  unlockedAchievementIds: [],
  claimedRewardIds: [],
  activeAttempt: null,
};
