import { z } from "zod";

const text = z.string().trim().min(1);
const option = z.object({ id: text, text });
const quizPart = {
  options: z.array(option).length(4),
  correctOptionId: text,
  explanation: text,
};

export const exerciseSchema = z.discriminatedUnion("type", [
  z.object({
    id: text,
    type: z.literal("multiple-choice"),
    prompt: text,
    ...quizPart,
  }),
  z.object({
    id: text,
    type: z.literal("fill-blank"),
    prompt: text,
    acceptedAnswers: z.array(text).min(1),
    explanation: text,
  }),
  z.object({
    id: text,
    type: z.literal("matching"),
    prompt: text,
    pairs: z.array(z.object({ id: text, left: text, right: text })).min(2),
    explanation: text,
  }),
  z.object({
    id: text,
    type: z.literal("sentence-order"),
    prompt: text,
    tokens: z.array(text).min(2),
    correctOrder: z.array(text).min(2),
    explanation: text,
  }),
  z.object({
    id: text,
    type: z.literal("reading"),
    prompt: text,
    text,
    ...quizPart,
  }),
  z.object({
    id: text,
    type: z.literal("listening"),
    prompt: text,
    script: text,
    audioRef: z
      .string()
      .regex(/^\/audio\/italian\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/)
      .optional(),
    ...quizPart,
  }),
  z.object({
    id: text,
    type: z.literal("writing"),
    prompt: text,
    reviewNote: text,
  }),
]);

export const lessonSchema = z
  .object({
    id: z.string().regex(/^(a2|b1|b2)-\d{3}$/),
    level: z.enum(["A2", "B1", "B2"]),
    number: z.number().int().min(1).max(100),
    status: z.enum(["unpublished", "published"]),
    title: text,
    description: text,
    estimatedMinutes: z.number().int().min(1).max(240),
    objectives: z.array(text).min(1),
    prerequisites: z.array(z.string().regex(/^(a2|b1|b2)-\d{3}$/)),
    explanations: z
      .array(z.object({ id: text, it: text, es: text }))
      .default([]),
    grammarExamples: z
      .array(z.object({ italian: text, spanish: text, note: text.optional() }))
      .default([]),
    vocabulary: z
      .array(
        z.object({
          id: text,
          italian: text,
          spanish: text,
          example: text.optional(),
          audioRef: z
            .string()
            .regex(/^\/audio\/italian\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/)
            .optional(),
        }),
      )
      .default([]),
    exercises: z.array(exerciseSchema).default([]),
    finalAssessment: z
      .object({
        exerciseIds: z.array(text).min(1),
        passingPercent: z.number().int().min(1).max(100),
      })
      .optional(),
    reviewNotes: z.array(text).default([]),
  })
  .superRefine((lesson, ctx) => {
    const expectedLevel =
      lesson.number <= 30 ? "A2" : lesson.number <= 65 ? "B1" : "B2";
    if (
      lesson.level !== expectedLevel ||
      lesson.id !==
        `${lesson.level.toLowerCase()}-${String(lesson.number).padStart(3, "0")}`
    )
      ctx.addIssue({
        code: "custom",
        message: "Lesson ID, number and level must agree.",
      });
    const ids = lesson.exercises.map((exercise) => exercise.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Duplicate exercise IDs." });
    if (
      new Set(lesson.vocabulary.map((word) => word.id)).size !==
      lesson.vocabulary.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate vocabulary IDs." });
    if (lesson.prerequisites.includes(lesson.id))
      ctx.addIssue({
        code: "custom",
        message: "A lesson cannot depend on itself.",
      });
    for (const exercise of lesson.exercises) {
      if (
        "options" in exercise &&
        (!exercise.options.some(
          (option) => option.id === exercise.correctOptionId,
        ) ||
          new Set(exercise.options.map((option) => option.id)).size !== 4)
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid options for ${exercise.id}.`,
        });
      if (
        exercise.type === "sentence-order" &&
        [...exercise.tokens].sort().join("|") !==
          [...exercise.correctOrder].sort().join("|")
      )
        ctx.addIssue({
          code: "custom",
          message: `Incorrect token permutation for ${exercise.id}.`,
        });
      if (
        exercise.type === "matching" &&
        new Set(exercise.pairs.map((pair) => pair.id)).size !==
          exercise.pairs.length
      )
        ctx.addIssue({
          code: "custom",
          message: `Duplicate pair ID in ${exercise.id}.`,
        });
    }
    for (const id of lesson.finalAssessment?.exerciseIds ?? []) {
      const exercise = lesson.exercises.find((item) => item.id === id);
      if (!exercise || exercise.type === "writing")
        ctx.addIssue({
          code: "custom",
          message: `Assessment exercise ${id} must exist and be auto-gradable.`,
        });
    }
  });

export type ItalianLesson = z.infer<typeof lessonSchema>;
export type ItalianExercise = ItalianLesson["exercises"][number];

export interface CurriculumEntry {
  id: string;
  level: "A2" | "B1" | "B2";
  number: number;
  status: "unpublished" | "published";
  title: string;
}

export function curriculumEntry(number: number): CurriculumEntry {
  const level = number <= 30 ? "A2" : number <= 65 ? "B1" : "B2";
  return {
    id: `${level.toLowerCase()}-${String(number).padStart(3, "0")}`,
    level,
    number,
    status: "unpublished",
    title: `Lesson ${String(number).padStart(3, "0")}`,
  };
}
