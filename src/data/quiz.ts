import type { QuizResultBand, QuizRewardRule } from "@/features/quiz/types";

export const quizResultBands = [
  {
    id: "stranger",
    minScore: 0,
    maxScore: 3,
    title: "WHO ARE YOU AND HOW DID YOU GET INTO THIS WEBSITE?",
    description:
      "Security has been notified. Please remain exactly where you are.",
    sticker: "Identity unclear",
  },
  {
    id: "we-need-to-talk",
    minScore: 4,
    maxScore: 5,
    title: "WE NEED TO TALK.",
    description:
      "Not urgently. But perhaps somewhere with snacks and supporting evidence.",
    sticker: "Formal review",
  },
  {
    id: "acceptable",
    minScore: 6,
    maxScore: 7,
    title: "ACCEPTABLE.",
    description:
      "The relationship remains operational. Additional research is encouraged.",
    sticker: "Barely certified",
  },
  {
    id: "girlfriend-verified",
    minScore: 8,
    maxScore: 9,
    title: "GIRLFRIEND VERIFIED",
    description:
      "Identity confirmed. Your access to Gianmaria-related intelligence remains active.",
    sticker: "Girlfriend approved",
  },
  {
    id: "soulmate",
    minScore: 10,
    maxScore: 10,
    title: "SOULMATE",
    description: "This is mildly concerning. You know too much.",
    sticker: "Perfect score",
  },
] as const satisfies readonly QuizResultBand[];

/** Thresholds are content configuration, not UI logic. */
export const quizRewardRules = [
  {
    kind: "achievement",
    threshold: 8,
    achievement: {
      id: "knows-too-much",
      title: "KNOWS TOO MUCH",
      description:
        "Awarded for demonstrating a professionally concerning knowledge of Gianmaria.",
    },
  },
  {
    kind: "coupon",
    threshold: 10,
    rewardId: "quiz-perfect-score-coupon",
  },
] as const satisfies readonly QuizRewardRule[];

export function getQuizResult(score: number): QuizResultBand {
  const result = quizResultBands.find(
    (band) => score >= band.minScore && score <= band.maxScore,
  );

  if (!result) {
    throw new Error(`No quiz result configured for score ${score}.`);
  }

  return result;
}

export const quizAchievementRule = quizRewardRules.find(
  (rule) => rule.kind === "achievement",
);

export const quizCouponRewardRule = quizRewardRules.find(
  (rule) => rule.kind === "coupon",
);
