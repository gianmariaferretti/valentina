import type { QuizQuestion } from "@/features/quiz/types";
import type { CornerQuestion } from "@/features/italian-corner/quiz/question-bank";

/** Pure transform so the 20-question paper can be audited without a database. */
export function createUnifiedRelationshipBank(
  original: readonly QuizQuestion[],
  imported: readonly CornerQuestion[],
  withheldIds: readonly string[],
): readonly CornerQuestion[] {
  const withheld = new Set(withheldIds);
  const selected: CornerQuestion[] = original
    .filter((question) => !withheld.has(question.id))
    .map((question) => ({
      id: `relationship:${question.id}`,
      level: "A2",
      category: "personal",
      text: question.prompt,
      options: question.options.map((option) => option.label) as [
        string,
        string,
        string,
        string,
      ],
      correct: question.options.findIndex(
        (option) => option.id === question.correctOptionId,
      ),
      explanation: question.feedback.correct,
    }));
  if (selected.length !== 10 || imported.length !== 10)
    throw new Error(
      "The unified paper needs ten valid questions from each source.",
    );
  const paper = imported.flatMap((question, index) => [
    selected[index],
    question,
  ]);
  if (
    new Set(paper.map((question) => question.id)).size !== 20 ||
    paper.some((question) => question.correct < 0 || question.correct > 3)
  )
    throw new Error(
      "The unified paper contains an invalid or duplicate answer key.",
    );
  return paper;
}
