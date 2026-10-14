import type { Metadata } from "next";

import { CornerQuiz } from "@/features/italian-corner/quiz/corner-quiz";
import { loadCornerQuiz } from "@/features/italian-corner/quiz/quiz-actions";

export const metadata: Metadata = { title: "The Gianmaria Exam" };

export default async function GianmariaExamPage() {
  return (
    <CornerQuiz
      quizId="gianmaria"
      title="The Gianmaria Exam"
      subtitle="Do You Really Know Your Boyfriend?"
      introduction={
        "One year together.\nTen questions.\nTen minutes.\nOne secret reward."
      }
      maxAttempts={2}
      passing={8}
      rewardHref="/coupons/gianmaria-exam-secret"
      snapshot={await loadCornerQuiz("gianmaria")}
    />
  );
}
