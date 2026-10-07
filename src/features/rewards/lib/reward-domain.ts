import type {
  ExperienceRewardDefinition,
  GrantedExperienceReward,
} from "@/features/rewards/types";

export function createRewardPresentation(
  reward: ExperienceRewardDefinition,
  newlyGranted: boolean,
): GrantedExperienceReward {
  switch (reward.kind) {
    case "coupon":
      return {
        id: reward.id,
        kind: reward.kind,
        ...reward.reveal,
        href: `/coupons/${reward.targetId}`,
        newlyGranted,
      };
  }
}
