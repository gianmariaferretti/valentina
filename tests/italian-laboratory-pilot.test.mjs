import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lessons = JSON.parse(
  readFileSync(
    new URL("../src/content/italian/laboratory/lessons.json", import.meta.url),
    "utf8",
  ),
);
const exam = JSON.parse(
  readFileSync(
    new URL(
      "../src/content/italian/laboratory/b1-exam-100.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("draft laboratory has exactly the intended lessons and no exam slot masquerading as a lesson", () => {
  const numbers = lessons.lessons.map((lesson) => lesson.number);
  assert.equal(numbers.length, 68);
  assert.equal(new Set(numbers).size, 68);
  assert.deepEqual(
    numbers.filter((number) => number < 100),
    Array.from({ length: 19 }, (_, index) => index + 81),
  );
  assert.deepEqual(
    numbers.filter((number) => number > 100),
    Array.from({ length: 49 }, (_, index) => index + 101),
  );
  assert.equal(numbers.includes(100), false);
  assert.equal(numbers.includes(150), false);
});

test("revised B2 lessons override the older generic material without losing activity IDs", () => {
  for (const lesson of lessons.lessons.filter(
    (item) => item.number >= 101 && item.number <= 120,
  )) {
    assert.equal(lesson.source, "b2-101-120-r1");
    assert.equal(lesson.status, "editorial-draft");
    assert.equal(lesson.examples.length, 8);
    assert.equal(lesson.activities.length, 17);
    assert.equal(new Set(lesson.activities.map((item) => item.id)).size, 17);
    assert.ok(lesson.theory[0].italian.length > 100);
  }
});

test("all draft lessons have content and stable exercise IDs", () => {
  for (const lesson of lessons.lessons) {
    assert.ok(["B1", "B2"].includes(lesson.level));
    assert.ok(lesson.theory.length > 0);
    assert.ok(lesson.examples.length > 0);
    assert.ok(lesson.activities.length > 0);
    assert.equal(
      new Set(lesson.activities.map((item) => item.id)).size,
      lesson.activities.length,
    );
    for (const activity of lesson.activities) {
      assert.ok(activity.prompt.trim());
      assert.ok(activity.id.length <= 100);
    }
  }
});

test("B1 exam is partial and never silently treats a transcript as delivered audio", () => {
  assert.equal(exam.lesson_number, 100);
  assert.equal(exam.level, "B1");
  assert.equal(exam.status, "COMPLETE_CONTENT_PENDING_HUMAN_PILOT");
  assert.equal(
    exam.sections
      .find((section) => section.id === "READ")
      .passages.flatMap((passage) => passage.questions).length,
    10,
  );
  assert.equal(
    exam.sections.find((section) => section.id === "LANG").questions.length,
    20,
  );
  assert.equal(
    exam.sections.find((section) => section.id === "WRITE").tasks.length,
    2,
  );
  assert.equal(
    exam.sections.find((section) => section.id === "LISTEN").audio_status,
    "SCRIPT_ONLY_AUDIO_NOT_PRODUCED",
  );
  assert.equal(
    exam.scoring_policy.missing_section_policy.includes(
      "non calcolare un esito finale",
    ),
    true,
  );
});
