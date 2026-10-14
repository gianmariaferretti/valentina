import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  gradeOriginalExercise,
  originalLessonSchema,
  prepareLesson,
  publicSections,
} from "../src/features/italian-corner/original-academy/lesson-model.ts";
import {
  buildSupplementalActivities,
  gradeSupplementalActivity,
  publicSupplementalActivities,
} from "../src/features/italian-corner/original-academy/supplemental-model.ts";

const root = join(process.cwd(), "src/content/italian/original-lessons");
const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const read = (file) => JSON.parse(readFileSync(join(root, file), "utf8"));

test("Original Academy imports exactly 001–080, four complete volumes and no duplicate ID", () => {
  assert.equal(index.length, 80);
  assert.deepEqual(
    index.map((entry) => entry.number),
    Array.from({ length: 80 }, (_, i) => i + 1),
  );
  assert.equal(new Set(index.map((entry) => entry.id)).size, 80);
  for (const volume of [1, 2, 3, 4]) {
    const entries = index.filter((entry) => entry.volume === volume);
    assert.equal(entries.length, 20);
    const preface = read(`volume-${volume}-preface.json`);
    assert.ok(preface.paragraphs.length > 0);
    let previousEnd = preface.paragraphs.length;
    for (const entry of entries) {
      const lesson = originalLessonSchema.parse(
        read(`lessons/${entry.id}.json`),
      );
      assert.equal(lesson.number, entry.number);
      assert.equal(lesson.title, entry.title);
      assert.equal(lesson.source.firstParagraph, previousEnd);
      assert.equal(
        lesson.source.lastParagraphExclusive - lesson.source.firstParagraph,
        lesson.paragraphs.length,
      );
      assert.equal(lesson.source.sha256, preface.sourceSha256);
      assert.equal(lesson.level, lesson.number <= 50 ? "A2" : "B1");
      previousEnd = lesson.source.lastParagraphExclusive;
    }
  }
});

test("Every lesson opens into progressive sections and retains practice plus teacher solutions", () => {
  let sourceParagraphs = 0;
  let gradable = 0;
  for (const entry of index) {
    const lesson = originalLessonSchema.parse(read(`lessons/${entry.id}.json`));
    sourceParagraphs += lesson.paragraphs.length;
    const sections = prepareLesson(lesson);
    const reconstructedText = sections.flatMap((section) => [
      ...(section.heading === "Prima di iniziare" ? [] : [section.heading]),
      ...section.paragraphs.map((paragraph) => paragraph.text),
    ]);
    assert.deepEqual(
      reconstructedText,
      lesson.paragraphs
        .slice(lesson.volume === 1 ? 2 : 1)
        .map((paragraph) => paragraph.text)
        .filter((text) => text.trim()),
      `${lesson.id} lost or reordered source text`,
    );
    assert.ok(sections.length >= 5, lesson.id);
    assert.ok(
      sections.some(
        (section) => section.kind === "practice" && section.exercises.length,
      ),
      lesson.id,
    );
    assert.ok(
      sections.some(
        (section) => section.kind === "solutions" && section.paragraphs.length,
      ),
      lesson.id,
    );
    const publicData = publicSections(sections);
    assert.ok(
      publicData.every((section) => section.kind !== "solutions"),
      lesson.id,
    );
    assert.ok(
      publicData
        .flatMap((section) => section.exercises)
        .every(
          (exercise) =>
            !("modelAnswer" in exercise) && !("originalFeedback" in exercise),
        ),
      lesson.id,
    );
    gradable += sections
      .flatMap((section) => section.exercises)
      .filter(
        (exercise) =>
          exercise.mode !== "open" &&
          exercise.mode !== "correction" &&
          exercise.mode !== "transformation",
      ).length;
  }
  assert.equal(sourceParagraphs, 3344);
  assert.ok(gradable > 400);
});

test("Every imported lesson has a literal dynamic import for production tracing", () => {
  const imports = readFileSync(
    join(
      process.cwd(),
      "src/features/italian-corner/original-academy/lesson-imports.ts",
    ),
    "utf8",
  );
  const paths = [
    ...imports.matchAll(
      /import\("@\/content\/italian\/original-lessons\/lessons\/((?:a2|b1)-\d{3})\.json"\)/g,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(
    paths,
    index.map((entry) => entry.id),
  );
});

test("Answer checking uses the original teacher key, not client-shipped answers", () => {
  const first = originalLessonSchema.parse(read("lessons/a2-001.json"));
  const exercises = prepareLesson(first).flatMap(
    (section) => section.exercises,
  );
  const choice = exercises.find((exercise) => exercise.mode === "choice");
  const fill = exercises.find((exercise) => exercise.mode === "fill");
  const order = exercises.find((exercise) => exercise.mode === "order");
  assert.ok(choice && fill && order);
  assert.equal(gradeOriginalExercise(choice, "parliamo"), 100);
  assert.equal(gradeOriginalExercise(choice, "parlano"), 0);
  assert.equal(gradeOriginalExercise(fill, "prendo"), 100);
  assert.equal(gradeOriginalExercise(order, "Loro studiano ogni sera"), 100);
});

test("Every original lesson has ten distinct supplemental interactions grounded in its source examples", () => {
  const modes = new Set();
  let total = 0;
  for (const entry of index) {
    const lesson = originalLessonSchema.parse(read(`lessons/${entry.id}.json`));
    const activities = buildSupplementalActivities(lesson);
    assert.equal(activities.length, 10, lesson.id);
    assert.equal(
      new Set(activities.map((activity) => activity.id)).size,
      10,
      lesson.id,
    );
    const publicActivities = publicSupplementalActivities(activities);
    for (const [position, activity] of activities.entries()) {
      modes.add(activity.kind);
      assert.ok(activity.prompt.trim(), `${lesson.id} ${position}`);
      assert.ok(activity.answer.trim(), `${lesson.id} ${position}`);
      assert.equal(
        gradeSupplementalActivity(activity, activity.answer),
        activity.kind === "flashcard" ? null : 100,
      );
      if (activity.kind !== "flashcard") {
        assert.ok(!("answer" in publicActivities[position]));
        assert.ok(!("explanation" in publicActivities[position]));
        assert.equal(
          gradeSupplementalActivity(activity, "deliberately wrong answer"),
          0,
        );
      }
    }
    total += activities.length;
  }
  assert.equal(total, 800);
  assert.deepEqual([...modes].sort(), [
    "choice",
    "fill",
    "flashcard",
    "matching",
    "order",
    "translation",
  ]);
  const present = buildSupplementalActivities(read("lessons/a2-001.json"));
  assert.equal(present[2].answer, "parlo");
  const particles = buildSupplementalActivities(read("lessons/a2-041.json"));
  assert.equal(particles[2].answer, "ci");
  assert.equal(particles[3].answer, "Ne");
  const congiuntivo = buildSupplementalActivities(read("lessons/b1-061.json"));
  assert.equal(congiuntivo[0].prompt, "Penso che Maria ____ a casa.");
  assert.equal(congiuntivo[1].answer, "è");
  const pronouns = buildSupplementalActivities(read("lessons/b1-071.json"));
  assert.equal(
    pronouns[1].prompt,
    "Ho telefonato a Giulia: ____ ho telefonato.",
  );
  const combined = buildSupplementalActivities(read("lessons/b1-072.json"));
  assert.equal(combined[0].answer, "Glielo");
});
