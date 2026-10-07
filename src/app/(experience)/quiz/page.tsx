import type { Metadata } from "next";

import { quizAchievementRule, quizCouponRewardRule } from "@/data/quiz";
import { getQuizQuestionViews } from "@/data/quiz-questions";
import { RelationshipQuiz } from "@/features/quiz/components/relationship-quiz";
import { getQuizStateRepository } from "@/features/quiz/repositories/get-quiz-state-repository";

export const metadata: Metadata = {
  title: "The Boyfriend Exam",
  description:
    "Ten questions to determine whether Valentina actually knows her boyfriend.",
};

export default async function QuizPage() {
  const state = await getQuizStateRepository().get();

  return (
    <RelationshipQuiz
      initialStats={{
        bestScore: state.bestScore,
        attempts: state.attempts,
        achievementUnlocked: quizAchievementRule
          ? state.unlockedAchievementIds.includes(
              quizAchievementRule.achievement.id,
            )
          : false,
        rewardClaimed: quizCouponRewardRule
          ? state.claimedRewardIds.includes(quizCouponRewardRule.rewardId)
          : false,
      }}
      questions={getQuizQuestionViews()}
    />
  );
}
