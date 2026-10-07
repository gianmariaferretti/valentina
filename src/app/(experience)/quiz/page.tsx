import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage() {
  return (
    <RouteScaffold
      description="Five questions, several traps and a scoring system that may not survive legal review."
      eyebrow="One relationship on the line"
      icon="quiz"
      note="The question model and progress repository are ready for the final boyfriend exam content."
      title="Do you actually know your boyfriend?"
    />
  );
}
