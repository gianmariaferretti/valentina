import type { ExperienceRewardDefinition } from "@/features/rewards/types";

export const experienceRewards = [
  {
    id: "italian-challenge-reward",
    kind: "coupon",
    targetId: "italian-challenge-secret",
    reveal: {
      eyebrow: "Italian examination passed.",
      title: "A sealed reward is yours",
      description:
        "Your reward is in the wallet. Gianmaria will supply the actual prize before redemption opens.",
      actionLabel: "View sealed reward",
    },
  },
  {
    id: "gianmaria-exam-reward",
    kind: "coupon",
    targetId: "gianmaria-exam-secret",
    reveal: {
      eyebrow: "Identity extremely verified.",
      title: "A sealed reward is yours",
      description:
        "Your reward is in the wallet. Gianmaria will supply the actual prize before redemption opens.",
      actionLabel: "View sealed reward",
    },
  },
  {
    id: "spicy-archive-completed",
    kind: "coupon",
    targetId: "you-found-me",
    reveal: {
      eyebrow: "You found something.",
      title: "GV-032 · You Found Me",
      description: "The file is open. Your coupon is saved in the wallet.",
      actionLabel: "View coupon",
    },
  },
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
  {
    id: "quiz-perfect-score-coupon",
    kind: "coupon",
    targetId: "classified-fourteen",
    reveal: {
      eyebrow: "Perfect score detected.",
      title: "Secret coupon unlocked",
      description:
        "GV-014 has been declassified. Apparently knowing far too much has practical benefits.",
      actionLabel: "Inspect the evidence",
    },
  },
] as const satisfies readonly ExperienceRewardDefinition[];

export function getExperienceReward(id: string) {
  return experienceRewards.find((reward) => reward.id === id);
}
