import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { createUnifiedRelationshipBank } from "../src/features/quiz/data/unified-bank-model.ts";
import {
  validArchiveAuthorization,
  validArchiveDate,
  validArchiveReference,
} from "../src/features/secret/lib/archive-domain.ts";
import {
  createOptionOrders,
  presentQuestions,
  scoreAnswers,
} from "../src/features/italian-corner/quiz/quiz-domain.ts";

async function loadServerData(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(
    source.replace('import "server-only";', ""),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  ).outputText;
  return import(
    "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
  );
}

const { quizQuestions } = await loadServerData("../src/data/quiz-questions.ts");
const { gianmariaQuestions } = await loadServerData(
  "../src/features/italian-corner/quiz/question-bank.ts",
);
const withheld = ["small-surprise", "who-is-more-right"];
const paper = createUnifiedRelationshipBank(
  quizQuestions,
  gianmariaQuestions,
  withheld,
);

test("unified exam preserves 12 + 10 source records while selecting 20 coherent questions", () => {
  assert.equal(quizQuestions.length, 12);
  assert.equal(gianmariaQuestions.length, 10);
  assert.equal(paper.length, 20);
  assert.equal(new Set(paper.map((question) => question.id)).size, 20);
  assert.equal(
    paper.filter((question) => question.id.startsWith("relationship:")).length,
    10,
  );
  assert.equal(
    paper.filter((question) => question.id.startsWith("gm")).length,
    10,
  );
  assert.ok(
    withheld.every((id) =>
      quizQuestions.some((question) => question.id === id),
    ),
  );
  for (let index = 0; index < 20; index += 2) {
    assert.ok(paper[index].id.startsWith("relationship:"));
    assert.ok(paper[index + 1].id.startsWith("gm"));
  }
});

test("answer keys remain server-side and a 20-question score is calculated from presented option orders", () => {
  const orders = createOptionOrders(paper, () => 0.37);
  const presented = presentQuestions(
    paper.map((question) => question.id),
    orders,
    paper,
  );
  assert.equal(presented.length, 20);
  assert.ok(presented.every((question) => !("correct" in question)));
  const answers = Object.fromEntries(
    paper.map((question) => [
      question.id,
      orders[question.id].indexOf(question.correct),
    ]),
  );
  assert.equal(
    scoreAnswers(
      paper.map((question) => question.id),
      orders,
      answers,
      paper,
    ).score,
    20,
  );
});

test("versioned SQL isolates historical attempts and uses an idempotent existing coupon grant", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261028231218_unified_boyfriend_exam.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /quiz_id = 'boyfriend-v2'/);
  assert.match(sql, /interval '15 minutes'/);
  assert.match(sql, /v_count >= 2/);
  assert.match(sql, /p_score >= 16/);
  assert.match(sql, /'gianmaria-exam-reward', 'gianmaria-exam-secret'/);
  assert.doesNotMatch(sql, /\b(delete|truncate)\s+(from\s+)?public\./i);
  const grant = readFileSync(
    new URL(
      "../supabase/migrations/20261008223505_grant_spicy_archive_reward.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(grant, /on conflict \(user_id, discovery_id\) do nothing/);
});

test("archive investigation is solvable from visible clues, but incomplete and reordered proofs fail", () => {
  assert.equal(
    validArchiveDate({ day: "31", month: "10", year: "2025" }),
    true,
  );
  assert.equal(
    validArchiveDate({ day: "04", month: "10", year: "2025" }),
    false,
  );
  assert.equal(validArchiveReference(["31", "V", "G"]), true);
  assert.equal(validArchiveReference(["G", "V", "31"]), false);
  assert.equal(validArchiveReference(["31", "V"]), false);
  assert.equal(
    validArchiveAuthorization(["inspect", "unseal", "authorize"]),
    true,
  );
  assert.equal(validArchiveAuthorization(["authorize"]), false);
});

test("Italian Challenge has a prominent CTA on the canonical Academy landing", () => {
  const page = readFileSync(
    new URL(
      "../src/app/(experience)/la-dolce-lingua/page.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(page, /aria-labelledby="italian-challenge-title"/);
  assert.match(page, /href="\/italian-corner\/challenge"/);
  assert.match(page, /Take the challenge/);
});
