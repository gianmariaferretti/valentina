export interface RewardRevealCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}

export interface CouponRewardDefinition {
  readonly id: string;
  readonly kind: "coupon";
  readonly targetId: string;
  readonly reveal: RewardRevealCopy;
}

/**
 * A discriminated union keeps reward triggers content-driven. New reward kinds
 * can be added here and handled by the reward executor without changing the UI.
 */
export type ExperienceRewardDefinition = CouponRewardDefinition;

export interface GrantedExperienceReward extends RewardRevealCopy {
  readonly id: string;
  readonly kind: ExperienceRewardDefinition["kind"];
  readonly href: string;
  readonly newlyGranted: boolean;
}
