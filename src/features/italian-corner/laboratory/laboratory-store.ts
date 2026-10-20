import "server-only";

import { z } from "zod";

import source from "@/content/italian/laboratory/lessons.json";

const activitySchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  prompt: z.string().min(1),
  modelAnswer: z.string().nullable(),
  answers: z.array(z.string()),
  feedback: z.string().nullable(),
});

const lessonSchema = z.object({
  number: z.number().int().min(81).max(149),
  level: z.enum(["B1", "B2"]),
  title: z.string().min(1),
  status: z.enum(["source-draft", "editorial-draft"]),
  source: z.string(),
  objectives: z.array(z.string()),
  theory: z
    .array(
      z.object({
        heading: z.string(),
        italian: z.string(),
        spanish: z.string(),
      }),
    )
    .min(1),
  examples: z
    .array(
      z.object({
        sentence: z.string(),
        explanation: z.string(),
      }),
    )
    .min(1),
  activities: z.array(activitySchema).min(1),
});

export type LaboratoryLesson = z.infer<typeof lessonSchema>;
export type LaboratoryActivity = LaboratoryLesson["activities"][number];

const parsed = z
  .object({ lessons: z.array(lessonSchema).length(68) })
  .parse(source);
const byNumber = new Map(
  parsed.lessons.map((lesson) => [lesson.number, lesson]),
);

export const laboratoryIndex = parsed.lessons.map(
  ({ number, level, title, status }) => ({
    number,
    level,
    title,
    status,
  }),
);

export function laboratoryHref(number: number) {
  return `/la-dolce-lingua/laboratorio/${String(number).padStart(3, "0")}`;
}

export function getLaboratoryLesson(number: number): LaboratoryLesson | null {
  return byNumber.get(number) ?? null;
}

export function publicLaboratoryLesson(lesson: LaboratoryLesson) {
  return {
    number: lesson.number,
    level: lesson.level,
    title: lesson.title,
    status: lesson.status,
    objectives: lesson.objectives,
    theory: lesson.theory,
    examples: lesson.examples,
    activities: lesson.activities.map(({ id, type, prompt }) => ({
      id,
      type,
      prompt,
    })),
  };
}

export function gradeLaboratoryAnswer(
  lesson: LaboratoryLesson,
  activity: LaboratoryActivity,
  answer: string,
) {
  // The older source contains answer keys that are not consistently tied to
  // the stated lesson topic. Never turn those drafts into automated marks.
  if (
    lesson.status !== "editorial-draft" ||
    !activity.answers.length ||
    activity.type !== "cloze"
  )
    return null;
  const normalize = (value: string) =>
    value
      .normalize("NFC")
      .trim()
      .toLocaleLowerCase("it-IT")
      .replace(/[.!?]+$/, "");
  return activity.answers.some(
    (expected) => normalize(expected) === normalize(answer),
  )
    ? 100
    : 0;
}
