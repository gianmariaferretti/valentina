import "server-only";

import { quizQuestions } from "@/data/quiz-questions";
import { gianmariaQuestions } from "@/features/italian-corner/quiz/question-bank";
import { createUnifiedRelationshipBank } from "./unified-bank-model";

/**
 * The original /quiz source has 12 records, rather than the 10 in the brief.
 * Preserve all 12. Withhold these two only from the versioned 20-question
 * paper for editorial review: one has a compound answer that conflicts with
 * its key; the other has two identical "Valentina" options.
 */
export const relationshipExamWithheldIds = [
  "small-surprise",
  "who-is-more-right",
] as const;

/** Alternate sources to make one examination, not two consecutive papers. */
export const relationshipExamQuestions = createUnifiedRelationshipBank(
  quizQuestions,
  gianmariaQuestions,
  relationshipExamWithheldIds,
);
