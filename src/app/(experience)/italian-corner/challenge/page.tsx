import type { Metadata } from "next";

import { CornerQuiz } from "@/features/italian-corner/quiz/corner-quiz";
import { loadCornerQuiz } from "@/features/italian-corner/quiz/quiz-actions";

export const metadata: Metadata = { title: "The Italian Challenge" };

export default async function ItalianChallengePage() {
  return (
    <CornerQuiz
      quizId="italian"
      title="The Italian Challenge"
      subtitle="Are You Italian Enough?"
      introduction="Fifteen questions. Ten minutes. One sealed reward. No mercy from the grammar department."
      maxAttempts={3}
      passing={12}
      rewardHref="/coupons/italian-challenge-secret"
      snapshot={await loadCornerQuiz("italian")}
    />
  );
}
