export interface ExperienceProgress {
  readonly redeemedCouponIds: readonly string[];
  readonly completedChallengeIds: readonly string[];
  readonly unlockedAchievementIds: readonly string[];
  readonly lastVisitedAt: string | null;
}

export const EMPTY_PROGRESS: ExperienceProgress = {
  redeemedCouponIds: [],
  completedChallengeIds: [],
  unlockedAchievementIds: [],
  lastVisitedAt: null,
};
