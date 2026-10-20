import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// This is a mechanical import, not an editorial approval. The draft status
// travels with every lesson so the site cannot mistake it for certified work.
const [legacyPath, revisedPath, examPath] = process.argv.slice(2);
if (!legacyPath || !revisedPath || !examPath) {
  throw new Error(
    "Usage: node scripts/import-italian-laboratory.mjs <061-150.json> <101-120.json> <b1-exam.json>",
  );
}

async function source(path) {
  const bytes = await readFile(resolve(path));
  return {
    data: JSON.parse(bytes.toString("utf8")),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const legacy = await source(legacyPath);
const revised = await source(revisedPath);
const exam = await source(examPath);
if (revised.data.publication_status !== "DRAFT_NOT_FOR_PUBLICATION") {
  throw new Error("Unexpected B2 draft status; review the new source first.");
}
if (exam.data.lesson_number !== 100 || exam.data.level !== "B1") {
  throw new Error("Expected the B1 exam at lesson 100.");
}
const revisedByNumber = new Map(
  revised.data.lessons.map((lesson) => [lesson.number, lesson]),
);
if (revisedByNumber.size !== 20) throw new Error("Expected 20 B2 revisions.");

const lessons = legacy.data.lessons
  .filter(
    (lesson) =>
      lesson.number >= 81 && lesson.number <= 149 && lesson.number !== 100,
  )
  .map((lesson) => {
    const improved = revisedByNumber.get(lesson.number);
    if (improved) {
      return {
        number: improved.number,
        level: improved.level,
        title: improved.title,
        status: "editorial-draft",
        source: "b2-101-120-r1",
        objectives: improved.objectives,
        theory: [
          {
            heading: "La regola",
            italian: improved.theory.italian,
            spanish: improved.theory.spanish,
          },
        ],
        examples: improved.examples.map((item) => ({
          sentence: item.sentence,
          explanation: item.explanation,
        })),
        activities: [
          ...improved.practice.map((item) => ({
            id: item.id,
            type: item.type,
            prompt: item.prompt,
            modelAnswer: item.model_answer ?? null,
            answers: [],
            feedback: null,
          })),
          ...improved.final_assessment.map((item) => ({
            id: item.id,
            type: item.type,
            prompt: item.prompt,
            modelAnswer: item.model_answer ?? null,
            answers: item.auto_grade && item.answer ? [item.answer] : [],
            feedback: item.feedback ?? null,
          })),
        ],
      };
    }
    return {
      number: lesson.number,
      level: lesson.level,
      title: lesson.title,
      status: "source-draft",
      source: "laboratory-061-150",
      objectives: lesson.learning_objectives,
      theory: lesson.theory.map((item) => ({
        heading: item.heading,
        italian: item.italian,
        spanish: item.espanol,
      })),
      examples: lesson.examples.map((item) => ({
        sentence: item.text,
        explanation: item.teacher_note,
      })),
      activities: [
        ...lesson.activities.map((item) => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          modelAnswer: item.model_answer ?? null,
          answers: Array.isArray(item.answer) ? item.answer : [],
          feedback: item.feedback ?? null,
        })),
        ...lesson.final_assessment.map((item) => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          modelAnswer: item.model_answer ?? null,
          answers: [],
          feedback: item.feedback ?? null,
        })),
      ],
    };
  });

if (
  lessons.length !== 68 ||
  new Set(lessons.map((item) => item.number)).size !== 68
) {
  throw new Error("Expected one lesson for each number 081–099 and 101–149.");
}
for (const lesson of lessons) {
  if (
    !lesson.theory.length ||
    !lesson.activities.length ||
    !lesson.examples.length
  )
    throw new Error(`Lesson ${lesson.number} is missing core study material.`);
  if (
    new Set(lesson.activities.map((item) => item.id)).size !==
    lesson.activities.length
  )
    throw new Error(`Lesson ${lesson.number} has duplicate activity IDs.`);
}

const output = resolve("src/content/italian/laboratory");
await mkdir(output, { recursive: true });
await writeFile(
  resolve(output, "lessons.json"),
  `${JSON.stringify(
    {
      editorialStatus: "PILOT_DRAFT_NOT_CERTIFIED",
      sources: { legacy: legacy.sha256, revised: revised.sha256 },
      lessons,
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(output, "b1-exam-100.json"),
  `${JSON.stringify({ sourceSha256: exam.sha256, ...exam.data }, null, 2)}\n`,
);
console.log(
  `Imported ${lessons.length} draft lessons and B1 exam 100; no database writes.`,
);
