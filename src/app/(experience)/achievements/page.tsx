import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";
import { quizAchievementRule } from "@/data/quiz";
import { loadQuizState } from "@/features/quiz/repositories/get-quiz-state-repository";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const state = await loadQuizState();
  const quizAchievementUnlocked = quizAchievementRule
    ? state.unlockedAchievementIds.includes(quizAchievementRule.achievement.id)
    : false;

  return (
    <RouteScaffold
      description="Milestones awarded for long-distance logistics, elite snack theft and other measurable relationship excellence."
      eyebrow="Progress, gamified unnecessarily"
      icon="achievements"
      note={
        quizAchievementUnlocked && quizAchievementRule
          ? `Unlocked: ${quizAchievementRule.achievement.title}. ${quizAchievementRule.achievement.description}`
          : "The first badge is waiting inside The Boyfriend Exam. Results are now archived across devices."
      }
      title="Badges for surviving us."
    />
  );
}
