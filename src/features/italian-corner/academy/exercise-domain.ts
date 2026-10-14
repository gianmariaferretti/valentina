import type { ItalianExercise, ItalianLesson } from "./lesson-schema";

export type ExerciseAnswer = string | string[] | Record<string, string>;

function normalize(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("it-IT");
}

export function scoreExercise(
  exercise: ItalianExercise,
  answer: ExerciseAnswer,
): { score: number; explanation: string } {
  switch (exercise.type) {
    case "multiple-choice":
    case "reading":
    case "listening":
      return {
        score: answer === exercise.correctOptionId ? 100 : 0,
        explanation: exercise.explanation,
      };
    case "fill-blank":
      return {
        score:
          typeof answer === "string" &&
          exercise.acceptedAnswers.some(
            (accepted) => normalize(accepted) === normalize(answer),
          )
            ? 100
            : 0,
        explanation: exercise.explanation,
      };
    case "matching": {
      if (!answer || typeof answer !== "object" || Array.isArray(answer))
        return { score: 0, explanation: exercise.explanation };
      const correct = exercise.pairs.filter(
        (pair, index) =>
          answer[pair.id] === `choice-${exercise.pairs.length - 1 - index}`,
      ).length;
      return {
        score: Math.round((correct / exercise.pairs.length) * 100),
        explanation: exercise.explanation,
      };
    }
    case "sentence-order":
      return {
        score:
          Array.isArray(answer) &&
          answer.join("\u0000") === exercise.correctOrder.join("\u0000")
            ? 100
            : 0,
        explanation: exercise.explanation,
      };
    case "writing":
      return { score: 0, explanation: exercise.reviewNote };
  }
}

export function publicLesson(lesson: ItalianLesson) {
  return {
    id: lesson.id,
    level: lesson.level,
    number: lesson.number,
    title: lesson.title,
    description: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes,
    objectives: lesson.objectives,
    explanations: lesson.explanations,
    grammarExamples: lesson.grammarExamples,
    vocabulary: lesson.vocabulary,
    reviewNotes: lesson.reviewNotes,
    finalAssessment: lesson.finalAssessment
      ? {
          exerciseIds: lesson.finalAssessment.exerciseIds,
          passingPercent: lesson.finalAssessment.passingPercent,
        }
      : null,
    exercises: lesson.exercises.map((exercise) => {
      switch (exercise.type) {
        case "multiple-choice":
        case "reading":
        case "listening":
          return {
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
            options: exercise.options,
            ...(exercise.type === "reading" ? { text: exercise.text } : {}),
            ...(exercise.type === "listening"
              ? { script: exercise.script, audioRef: exercise.audioRef }
              : {}),
          };
        case "fill-blank":
          return {
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
          };
        case "matching":
          return {
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
            left: exercise.pairs.map((pair) => ({
              id: pair.id,
              text: pair.left,
            })),
            right: [...exercise.pairs].reverse().map((pair, index) => ({
              id: `choice-${index}`,
              text: pair.right,
            })),
          };
        case "sentence-order":
          return {
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
            tokens: [...exercise.tokens].reverse(),
          };
        case "writing":
          return {
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
          };
      }
    }),
  };
}

export type PublicLesson = ReturnType<typeof publicLesson>;
