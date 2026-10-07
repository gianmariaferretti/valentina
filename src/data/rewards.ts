import type { ExperienceRewardDefinition } from "@/features/rewards/types";

export const experienceRewards = [
  {
    id: "open-when-surprise-coupon",
    kind: "coupon",
    targetId: "classified-twelve",
    reveal: {
      eyebrow: "You found something.",
      title: "New coupon discovered",
      description:
        "GV-012 has left the classified archive and entered Valentina’s wallet. Financial responsibility has been notified.",
      actionLabel: "View the new coupon",
    },
  },
] as const satisfies readonly ExperienceRewardDefinition[];

export function getExperienceReward(id: string) {
  return experienceRewards.find((reward) => reward.id === id);
}
