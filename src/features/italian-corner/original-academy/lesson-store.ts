import "server-only";

import index from "@/content/italian/original-lessons/index.json";

import { lessonImporters } from "./lesson-imports";
import { originalLessonSchema, type OriginalLesson } from "./lesson-model";

export type LessonIndexEntry = (typeof index)[number];
export const originalCurriculum: LessonIndexEntry[] = index;

export function lessonHref(number: number) {
  return `/la-dolce-lingua/lessons/${String(number).padStart(3, "0")}`;
}

export async function getOriginalLesson(
  number: number,
): Promise<OriginalLesson | null> {
  const entry = originalCurriculum.find((item) => item.number === number);
  if (!entry) return null;
  try {
    const importer = lessonImporters[entry.id];
    if (!importer) throw new Error(`Missing bundled lesson: ${entry.id}`);
    return originalLessonSchema.parse((await importer()).default);
  } catch (error) {
    console.error("Unable to read original Italian lesson", entry.id, error);
    return null;
  }
}
