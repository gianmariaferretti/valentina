import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  curriculumEntry,
  lessonSchema,
  type ItalianLesson,
} from "./lesson-schema";

const root = path.join(process.cwd(), "src", "content", "italian");
const idPattern = /^(a2|b1|b2)-\d{3}$/;

async function readLesson(file: string): Promise<ItalianLesson | null> {
  try {
    const text = await readFile(file, "utf8");
    const parsed = lessonSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("Invalid Italian lesson file:", file, parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    console.error("Unable to read Italian lesson:", file, error);
    return null;
  }
}

export async function getLesson(
  id: string,
  preview = false,
): Promise<ItalianLesson | null> {
  if (!idPattern.test(id)) return null;
  const lesson = await readLesson(
    path.join(root, id.slice(0, 2), `${id}.json`),
  );
  if (preview && process.env.NODE_ENV === "development") {
    if (lesson) return lesson;
    return id === "a2-001"
      ? readLesson(path.join(root, "fixtures", "example-lesson.json"))
      : null;
  }
  return lesson?.status === "published" ? lesson : null;
}

export async function getCurriculum() {
  const entries = Array.from({ length: 100 }, (_, index) =>
    curriculumEntry(index + 1),
  );
  for (const level of ["a2", "b1", "b2"] as const) {
    let files: string[];
    try {
      files = await readdir(path.join(root, level));
    } catch {
      continue;
    }
    for (const name of files.filter(
      (file) =>
        idPattern.test(file.replace(/\.json$/, "")) && file.endsWith(".json"),
    )) {
      const lesson = await getLesson(name.slice(0, -5));
      if (!lesson) continue;
      const slot = entries[lesson.number - 1];
      if (slot && slot.id === lesson.id)
        entries[lesson.number - 1] = {
          ...slot,
          title: lesson.title,
          status: "published",
        };
    }
  }
  return entries;
}

export async function getPublishedLessons(): Promise<ItalianLesson[]> {
  const entries = await getCurriculum();
  const loaded = await Promise.all(
    entries
      .filter((entry) => entry.status === "published")
      .map((entry) => getLesson(entry.id)),
  );
  return loaded.filter((lesson): lesson is ItalianLesson => lesson !== null);
}
