import "server-only";

import { getCoupon } from "@/data/coupons";
import { getCouponStateRepository } from "@/features/coupons/repositories/get-coupon-state-repository";
import { createRewardPresentation } from "@/features/rewards/lib/reward-domain";
import type {
  ExperienceRewardDefinition,
  GrantedExperienceReward,
} from "@/features/rewards/types";

export async function grantExperienceReward(
  reward: ExperienceRewardDefinition,
): Promise<GrantedExperienceReward> {
  switch (reward.kind) {
    case "coupon": {
      if (!getCoupon(reward.targetId)) {
        throw new Error(`Reward coupon ${reward.targetId} does not exist.`);
      }

      const repository = getCouponStateRepository();
      const newlyGranted = await repository.unlock({
        couponId: reward.targetId,
        discoveredAt: new Date().toISOString(),
        discoveryId: reward.id,
        source: "reward",
      });

      return createRewardPresentation(reward, newlyGranted);
    }
  }
}
