import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kissRewardDefaults,
  kissRewardLabels,
} from "../src/data/kiss-rewards.ts";
import {
  EVENT_KEY,
  kissAmountsSchema,
  placeCredit,
  planCredits,
  prettify,
  resolveAmounts,
  toastLines,
} from "../src/features/kisses/lib/rewards.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const empty = {
  gameWins: [],
  quizCompleted: false,
  lessons: [],
  exams: [],
  achievements: [],
  letters: [],
  bucket: [],
};

test("amounts: defaults, panel overrides, invalid values ignored", () => {
  assert.deepEqual(resolveAmounts(null), kissRewardDefaults);
  const merged = resolveAmounts({
    gameWin: 120,
    quizComplete: 0,
    achievement: -5,
    letterFirstOpen: "abc",
    placeFirstOpen: 5000,
  });
  assert.equal(merged.gameWin, 120);
  assert.equal(merged.quizComplete, 0);
  assert.equal(merged.achievement, kissRewardDefaults.achievement);
  assert.equal(merged.letterFirstOpen, kissRewardDefaults.letterFirstOpen);
  assert.equal(merged.placeFirstOpen, kissRewardDefaults.placeFirstOpen);
  assert.deepEqual(
    Object.keys(kissRewardLabels),
    Object.keys(kissRewardDefaults),
  );
  assert.equal(
    kissAmountsSchema.safeParse({ ...kissRewardDefaults, gameWin: "60" })
      .success,
    true,
  );
  assert.equal(
    kissAmountsSchema.safeParse({ ...kissRewardDefaults, gameWin: 1.5 })
      .success,
    false,
  );
  assert.equal(
    kissAmountsSchema.safeParse({ gameWin: 10 }).success,
    false,
    "every amount is required",
  );
});

test("every event gets one stable key, paid ones and zero amounts are skipped", () => {
  const progress = {
    gameWins: [{ id: "snake", title: "Snake" }],
    quizCompleted: true,
    lessons: ["lesson-01"],
    exams: [{ id: "italian", title: "The Italian Challenge" }],
    achievements: [{ id: "defence-breaker", title: "Defence breaker" }],
    letters: [{ slug: "you-miss-me", title: "You miss me" }],
    bucket: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Paris",
        kisses: 30,
      },
      { id: "22222222-2222-4222-8222-222222222222", title: "Bad", kisses: 0 },
    ],
  };
  const amounts = { ...kissRewardDefaults, lessonComplete: 0 };
  const plan = planCredits(progress, amounts, new Set(["letter:you-miss-me"]));
  assert.deepEqual(
    plan.map((c) => [c.key, c.amount]),
    [
      ["game:snake", 50],
      ["quiz:first", 40],
      ["exam:italian", 80],
      ["achievement:defence-breaker", 25],
      ["bucket:11111111-1111-4111-8111-111111111111", 30],
    ],
  );
  for (const credit of plan) {
    assert.match(credit.key, EVENT_KEY);
    assert.ok(credit.label.length >= 1 && credit.label.length <= 160);
  }
  // Running it again after paying everything plans nothing.
  assert.deepEqual(
    planCredits(
      progress,
      amounts,
      new Set(plan.map((c) => c.key)).add("letter:you-miss-me"),
    ),
    [],
  );
  assert.deepEqual(planCredits(empty, amounts, new Set()), []);
});

test("odd ids become safe keys; long labels are clipped", () => {
  const plan = planCredits(
    {
      ...empty,
      achievements: [{ id: "weird id/with spaces", title: "x".repeat(300) }],
    },
    kissRewardDefaults,
    new Set(),
  );
  assert.equal(plan[0].key, "achievement:weird-id-with-spaces");
  assert.equal(plan[0].label.length, 160);
  assert.equal(prettify("defence-breaker"), "Defence breaker");
});

test("first visit to a place, unless switched off", () => {
  const credit = placeCredit("rome", "Rome", kissRewardDefaults);
  assert.equal(credit.key, "place:rome");
  assert.equal(credit.amount, 10);
  assert.equal(
    placeCredit("rome", "Rome", { ...kissRewardDefaults, placeFirstOpen: 0 }),
    null,
  );
});

test("a backlog becomes one toast; a few credits stay separate", () => {
  assert.equal(
    toastLines([
      { amount: 10, label: "a" },
      { amount: 20, label: "b" },
    ]).length,
    2,
  );
  const lines = toastLines(
    Array.from({ length: 6 }, () => ({ amount: 10, label: "x" })),
  );
  assert.equal(lines.length, 1);
  assert.equal(lines[0].amount, 60);
});

test("the migration: one credit per event, service-role only, forced RLS", () => {
  const sql = read("supabase/migrations/20261117140000_site_kiss_rewards.sql");
  assert.match(sql, /primary key \(user_id, event_key\)/);
  assert.match(
    sql,
    /alter table public\.kiss_credits force row level security/,
  );
  assert.match(
    sql,
    /revoke all on public\.kiss_credits from public, anon, authenticated/,
  );
  assert.match(sql, /on conflict \(user_id, event_key\) do nothing/);
  assert.equal(sql.match(/security invoker/g).length, 2);
  assert.equal(sql.match(/set search_path = ''/g).length, 2);
  // Same key rule in SQL and TypeScript.
  assert.ok(sql.includes(`'${EVENT_KEY.source}'`));
  // Bucket ticks paid before the migration are never paid twice.
  assert.match(sql, /'bucket:' \|\| l\.id/);
});

test("credits happen only on the server, behind the session or the panel", () => {
  const action = read("src/features/kisses/actions.ts");
  assert.match(action, /"use server"/);
  assert.match(action, /hasValidAccessSession\(\)/);
  const repo = read("src/features/kisses/repositories/kisses.ts");
  assert.match(repo, /import "server-only"/);
  const admin = read("src/features/admin/actions/kisses.ts");
  for (const body of admin.split("export async function ").slice(1))
    assert.match(body, /return withAdmin\(/);
  assert.match(admin, /kissAmountsSchema\.safeParse/);
  // The old unkeyed credit is gone; bucket ticks use their own key.
  for (const file of [
    "src/features/life/actions/lists.ts",
    "src/features/admin/actions/life.ts",
  ]) {
    assert.doesNotMatch(read(file), /creditKisses\(/);
    assert.match(read(file), /key: `bucket:\$\{/);
  }
  assert.match(
    read("src/app/(experience)/map/[place]/page.tsx"),
    /after\(\(\) =>\s*creditPlaceVisit\(/,
  );
});

test("the listener runs in the layout and flies to the casino tab", () => {
  assert.match(read("src/app/(experience)/layout.tsx"), /<KissListener \/>/);
  assert.equal(
    read("src/components/layout/site-header.tsx").match(/data-kiss-target=/g)
      .length,
    2,
  );
  for (const file of [
    "src/features/games/components/game-experience.tsx",
    "src/features/quiz/components/relationship-quiz.tsx",
    "src/features/open-when/components/letter-experience.tsx",
    "src/features/life/components/bucket-list.tsx",
    "src/features/italian-corner/original-academy/lesson-experience.tsx",
    "src/features/italian-corner/quiz/corner-quiz.tsx",
  ])
    assert.match(read(file), /requestKissCheck\(\)/, file);
  const listener = read("src/features/kisses/components/kiss-listener.tsx");
  assert.match(listener, /prefers-reduced-motion: reduce/);
  assert.match(listener, /icon: "💋"/);
});
