import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import {
  selectItalianQuestions,
  createOptionOrders,
  presentQuestions,
  scoreAnswers,
  personalResult,
} from "../src/features/italian-corner/quiz/quiz-domain.ts";
import {
  lessonSchema,
  curriculumEntry,
} from "../src/features/italian-corner/academy/lesson-schema.ts";
import {
  scoreExercise,
  publicLesson,
} from "../src/features/italian-corner/academy/exercise-domain.ts";

const source = readFileSync(
  new URL(
    "../src/features/italian-corner/quiz/question-bank.ts",
    import.meta.url,
  ),
  "utf8",
);
const compiled = ts.transpileModule(
  source.replace('import "server-only";', ""),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
).outputText;
const { italianQuestions, gianmariaQuestions, quizDefinitions } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../src/content/italian/fixtures/example-lesson.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("Italian bank has exactly 60 unique, explained, four-option questions in required distribution", () => {
  assert.equal(italianQuestions.length, 60);
  assert.equal(
    new Set(italianQuestions.map((question) => question.id)).size,
    60,
  );
  assert.deepEqual(
    Object.fromEntries(
      ["grammar", "vocabulary", "verb-tense", "everyday", "reading"].map(
        (category) => [
          category,
          italianQuestions.filter((question) => question.category === category)
            .length,
        ],
      ),
    ),
    { grammar: 20, vocabulary: 15, "verb-tense": 10, everyday: 10, reading: 5 },
  );
  for (const question of italianQuestions) {
    assert.ok(["A2", "B1"].includes(question.level));
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.correct >= 0 && question.correct < 4);
    assert.ok(question.text.length > 10 && question.explanation.length > 10);
  }
});

test("Gianmaria exam preserves exactly the owner's ten correct answers", () => {
  assert.equal(gianmariaQuestions.length, 10);
  assert.deepEqual(
    gianmariaQuestions.map((question) => question.options[question.correct]),
    [
      "Pizza",
      "Potenza",
      "Rocco",
      "A seal",
      "Coffee",
      "You were incredibly beautiful",
      "Whether you had found a place to live",
      "Brussels",
      "A beach holiday",
      "My sister",
    ],
  );
  assert.equal(quizDefinitions.gianmaria.maxAttempts, 2);
  assert.equal(quizDefinitions.italian.maxAttempts, 3);
  assert.equal(quizDefinitions.italian.durationSeconds, 600);
});

test("Every randomized Italian paper is balanced, has shuffled options and never exposes keys", () => {
  const everSelected = new Set();
  const readingLevels = new Set();
  for (let seed = 1; seed <= 2000; seed++) {
    let state = seed;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    const selected = selectItalianQuestions(italianQuestions, random);
    selected.forEach((question) => everSelected.add(question.id));
    readingLevels.add(
      selected.find((question) => question.category === "reading").level,
    );
    assert.equal(selected.length, 15);
    assert.equal(new Set(selected.map((question) => question.id)).size, 15);
    assert.deepEqual(
      Object.fromEntries(
        ["grammar", "vocabulary", "verb-tense", "everyday", "reading"].map(
          (category) => [
            category,
            selected.filter((question) => question.category === category)
              .length,
          ],
        ),
      ),
      { grammar: 5, vocabulary: 4, "verb-tense": 3, everyday: 2, reading: 1 },
    );
    assert.equal(
      selected.filter((question) => question.level === "A2").length,
      8,
    );
    const ids = selected.map((question) => question.id);
    const orders = createOptionOrders(selected, random);
    const views = presentQuestions(ids, orders, italianQuestions);
    assert.ok(
      views.every((view) => !("correct" in view) && !("explanation" in view)),
    );
    const correct = Object.fromEntries(
      selected.map((question) => [
        question.id,
        orders[question.id].indexOf(question.correct),
      ]),
    );
    assert.equal(
      scoreAnswers(ids, orders, correct, italianQuestions).score,
      15,
    );
    assert.equal(scoreAnswers(ids, orders, {}, italianQuestions).score, 0);
  }
  assert.equal(everSelected.size, 60);
  assert.deepEqual([...readingLevels].sort(), ["A2", "B1"]);
});

test("Result bands use the requested labels", () => {
  assert.deepEqual([0, 3, 4, 5, 6, 7, 8, 9, 10].map(personalResult), [
    "Are we even dating?",
    "Are we even dating?",
    "You know the basics.",
    "You know the basics.",
    "Certified Girlfriend.",
    "Certified Girlfriend.",
    "Gianmaria Expert.",
    "Gianmaria Expert.",
    "You know me better than I know myself.",
  ]);
});

test("Curriculum has 100 unpublished slots and fixture validates but exposes no answer key", () => {
  const entries = Array.from({ length: 100 }, (_, index) =>
    curriculumEntry(index + 1),
  );
  assert.equal(entries.filter((entry) => entry.level === "A2").length, 30);
  assert.equal(entries.filter((entry) => entry.level === "B1").length, 35);
  assert.equal(entries.filter((entry) => entry.level === "B2").length, 35);
  assert.ok(entries.every((entry) => entry.status === "unpublished"));
  const parsed = lessonSchema.parse(fixture);
  const client = publicLesson(parsed);
  assert.equal(client.exercises.length, 7);
  assert.ok(
    client.exercises.every(
      (exercise) =>
        !("correctOptionId" in exercise) &&
        !("acceptedAnswers" in exercise) &&
        !("correctOrder" in exercise),
    ),
  );
});

test("All Academy exercise types score correctly and malformed content fails schema", () => {
  const parsed = lessonSchema.parse(fixture);
  const byId = (id) => parsed.exercises.find((exercise) => exercise.id === id);
  assert.equal(scoreExercise(byId("mc-1"), "a").score, 100);
  assert.equal(scoreExercise(byId("mc-1"), "b").score, 0);
  assert.equal(scoreExercise(byId("blank-1"), " vorrei ").score, 100);
  assert.equal(
    scoreExercise(byId("match-1"), { coffee: "choice-1", water: "choice-0" })
      .score,
    100,
  );
  assert.equal(
    scoreExercise(byId("order-1"), [
      "Vorrei",
      "un caffè,",
      "per",
      "favore",
      ".",
    ]).score,
    100,
  );
  assert.equal(scoreExercise(byId("read-1"), "a").score, 100);
  assert.equal(scoreExercise(byId("listen-1"), "a").score, 100);
  assert.equal(scoreExercise(byId("write-1"), "Vorrei un caffè").score, 0);
  assert.equal(
    lessonSchema.safeParse({ ...fixture, id: "b2-001" }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({
      ...fixture,
      exercises: [...fixture.exercises, fixture.exercises[0]],
    }).success,
    false,
  );
});

test("Migration keeps new quiz and lesson tables private, uses server-only RPC grants", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261013225943_italian_corner_state.sql",
      import.meta.url,
    ),
    "utf8",
  );
  for (const table of [
    "italian_corner_attempts",
    "italian_lesson_progress",
    "italian_exercise_results",
    "italian_vocabulary_review",
    "italian_level_exams",
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}`));
  }
  assert.match(sql, /enable row level security/);
  assert.match(
    sql,
    /revoke all on public\.%I from public, anon, authenticated/,
  );
  assert.match(sql, /v_count >= v_limit/);
  assert.match(sql, /now\(\) > v_attempt\.expires_at then p_score := 0/);
  assert.match(sql, /on conflict \(user_id, discovery_id\) do nothing/);
});
