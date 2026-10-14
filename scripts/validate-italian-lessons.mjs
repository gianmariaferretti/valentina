import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { lessonSchema } from "../src/features/italian-corner/academy/lesson-schema.ts";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const root = path.join(projectRoot, "src", "content", "italian");
const curriculum = JSON.parse(
  await readFile(path.join(root, "curriculum.json"), "utf8"),
);
const errors = [];
const seenIds = new Set();
const lessons = [];
const expectedRanges = [
  ["A2", 1, 30],
  ["B1", 31, 65],
  ["B2", 66, 100],
];

if (
  JSON.stringify(
    curriculum.levels.map(({ level, firstLesson, lastLesson }) => [
      level,
      firstLesson,
      lastLesson,
    ]),
  ) !== JSON.stringify(expectedRanges)
)
  errors.push("Curriculum level ranges must be A2 1–30, B1 31–65, B2 66–100.");

for (const level of ["a2", "b1", "b2"]) {
  const dir = path.join(root, level);
  let files;
  try {
    files = await readdir(dir);
  } catch {
    files = [];
  }
  for (const name of files.filter((name) => name.endsWith(".json"))) {
    let value;
    try {
      value = JSON.parse(await readFile(path.join(dir, name), "utf8"));
    } catch (error) {
      errors.push(`${level}/${name}: invalid JSON (${error.message})`);
      continue;
    }
    const result = lessonSchema.safeParse(value);
    if (!result.success) {
      errors.push(
        `${level}/${name}: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
      continue;
    }
    const lesson = result.data;
    if (name !== `${lesson.id}.json` || lesson.level.toLowerCase() !== level)
      errors.push(
        `${level}/${name}: filename, folder and lesson identity disagree.`,
      );
    if (seenIds.has(lesson.id))
      errors.push(`${level}/${name}: duplicate lesson ID ${lesson.id}.`);
    seenIds.add(lesson.id);
    lessons.push(lesson);
    if (
      lesson.status === "published" &&
      (lesson.explanations.some(({ it, es }) => !it || !es) ||
        lesson.grammarExamples.some(
          ({ italian, spanish }) => !italian || !spanish,
        ) ||
        lesson.vocabulary.some(({ italian, spanish }) => !italian || !spanish))
    )
      errors.push(`${lesson.id}: published translations must be complete.`);
  }
}

for (const lesson of lessons) {
  for (const prerequisite of lesson.prerequisites) {
    if (!seenIds.has(prerequisite))
      errors.push(`${lesson.id}: missing prerequisite ${prerequisite}.`);
    const priorNumber = Number(prerequisite.slice(3));
    if (priorNumber >= lesson.number)
      errors.push(
        `${lesson.id}: prerequisite ${prerequisite} must precede the lesson.`,
      );
  }
}

const fixture = JSON.parse(
  await readFile(path.join(root, "fixtures", "example-lesson.json"), "utf8"),
);
const fixtureResult = lessonSchema.safeParse(fixture);
if (!fixtureResult.success || fixture.status !== "unpublished")
  errors.push("Development fixture must validate and remain unpublished.");

if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `✓ Curriculum ranges: 100 slots; ${lessons.length} authored files; ${lessons.filter((lesson) => lesson.status === "published").length} published; fixture valid.`,
  );
}
