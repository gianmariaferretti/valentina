import type { Metadata } from "next";

import { CornerQuiz } from "@/features/italian-corner/quiz/corner-quiz";
import { loadCornerQuiz } from "@/features/italian-corner/quiz/quiz-actions";

export const metadata: Metadata = {
  title: "Do You Actually Know Your Boyfriend?",
  description: "Twenty questions. Fifteen minutes. One boyfriend.",
};

export default async function QuizPage() {
  return (
    <CornerQuiz
      quizId="boyfriend-v2"
      title="Do You Actually Know Your Boyfriend?"
      subtitle="The definitive relationship examination"
      introduction="20 Questions. 15 Minutes. One Boyfriend. One Secret Reward."
      maxAttempts={2}
      passing={16}
      rewardHref="/coupons/gianmaria-exam-secret"
      snapshot={await loadCornerQuiz("boyfriend-v2")}
    />
  );
}
