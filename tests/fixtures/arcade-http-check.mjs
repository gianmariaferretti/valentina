/** Actual Next actions → Supabase SDK → isolated PostgreSQL. Never a live DB. */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createDefenceState,
  stepDefence,
} from "../../src/features/games/break-defences/arcade-domain.ts";
import {
  createSnakeState,
  snakeSafeCycle,
  queueSnakeDirection,
  stepSnake,
} from "../../src/features/games/lib/snake-domain.ts";
import {
  createMazeState,
  solveMaze,
  stepMaze,
} from "../../src/features/games/lib/maze-domain.ts";
import {
  createMineState,
  generateMineBoard,
  actMine,
} from "../../src/features/games/lib/classic-minefield.ts";
import { createMemoryState } from "../../src/features/games/lib/memory-domain.ts";

const origin = new URL(process.env.VG_QA_ORIGIN ?? "http://127.0.0.1:3101");
if (!["localhost", "127.0.0.1"].includes(origin.hostname))
  throw new Error("Isolated loopback QA only");
const expiry = String(Math.floor(Date.now() / 1000) + 900),
  secret = process.env.AUTH_SECRET;
if (!secret) throw new Error("Disposable local AUTH_SECRET required");
const cookie = `vg_access=${expiry}.${createHmac("sha256", secret).update(expiry).digest("base64url")}`;
const manifest = JSON.parse(
  readFileSync(".next/server/server-reference-manifest.json", "utf8"),
);
const actionId = (name) =>
  Object.entries(manifest.node).find(([, a]) => a.exportedName === name)?.[0];
async function action(name, args, authenticated = true) {
  const response = await fetch(new URL("/challenges", origin), {
    method: "POST",
    headers: {
      "Next-Action": actionId(name),
      Origin: origin.origin,
      Cookie: authenticated ? cookie : "",
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify(args),
  });
  assert.equal(response.status, 200, name);
  const text = await response.text();
  for (const line of text.split("\n")) {
    const match = line.match(/^[0-9a-f]+:(\{.*\})$/);
    if (match) {
      const value = JSON.parse(match[1]);
      if (["success", "error"].includes(value.status)) return value;
    }
  }
  throw new Error("Missing Server Action result: " + name);
}
const seed = 17;
function breakout(lose) {
  const state = createDefenceState(),
    inputs = [];
  while (!["victory", "lost"].includes(state.mode) && inputs.length < 180000) {
    let target = 210;
    if (state.ball.vy > 0) {
      let x =
        state.ball.x + (state.ball.vx * (510 - state.ball.y)) / state.ball.vy;
      x = (((x - 6) % 816) + 816) % 816;
      if (x > 408) x = 816 - x;
      target = x + 6 + Math.sin(state.elapsed * 0.713) * 20;
      if (lose && state.lives === 3) target = x > 204 ? 34 : 386;
    }
    target = Math.round(Math.max(34, Math.min(386, target)) * 100) / 100;
    const launch = state.mode === "serve";
    inputs.push(Math.round(target * 100) + (launch ? 100000 : 0));
    stepDefence(state, target, launch, true);
  }
  assert.equal(state.mode, "victory");
  return { seed, inputs, perfectVictory: true };
}
function snake() {
  const state = createSnakeState(seed),
    cycle = snakeSafeCycle(),
    inputs = [];
  state.status = "playing";
  while (state.status === "playing" && inputs.length < 30000) {
    const next = cycle[(cycle.indexOf(state.body[0]) + 1) % cycle.length],
      d = next - state.body[0],
      command = d === 1 ? 1 : d === -1 ? 3 : d === 24 ? 2 : 0;
    inputs.push(command);
    queueSnakeDirection(state, command);
    stepSnake(state);
  }
  assert.equal(state.status, "won");
  return { seed, inputs };
}
function maze() {
  const state = createMazeState(seed),
    route = solveMaze(state.board),
    inputs = [];
  state.status = "playing";
  for (const next of route.slice(1)) {
    const d = next - state.position,
      command = d === -45 ? 1 : d === 1 ? 2 : d === 45 ? 3 : 4;
    inputs.push(command);
    stepMaze(state, command);
  }
  assert.equal(state.status, "won");
  return { seed, inputs };
}
function mines() {
  const state = createMineState(),
    inputs = [];
  state.board = generateMineBoard(seed, 17);
  state.status = "playing";
  for (const cell of [17, ...Array.from({ length: 256 }, (_, i) => i)]) {
    if (
      state.board.mines.has(cell) ||
      state.revealed.has(cell) ||
      state.status === "won"
    )
      continue;
    inputs.push(cell * 3);
    actMine(state, cell, 0);
  }
  assert.equal(state.status, "won");
  return { seed, inputs };
}
function memory() {
  const state = createMemoryState(seed),
    ids = [...new Set(state.deck.map((c) => c.memoryId))],
    inputs = [],
    times = [];
  for (const id of ids)
    state.deck.forEach((card, index) => {
      if (card.memoryId === id) {
        times.push(inputs.length * 500);
        inputs.push(index);
      }
    });
  return { seed, inputs, times };
}
assert.equal(
  (await action("beginVgGameRun", ["snake", "standard"], false)).status,
  "error",
);
assert.equal(
  (await action("beginVgGameRun", ["unknown", "standard"])).status,
  "error",
);
assert.equal(
  (
    await action("finishVgGameRun", [
      {
        runId: "forged",
        gameId: "snake",
        durationMs: 1,
        discoveredSecrets: [],
      },
    ])
  ).status,
  "error",
);
for (const [gameId, evidence, expected] of [
  ["break-defences", breakout(true), ["break-defences-premium-coupon"]],
  [
    "break-defences",
    breakout(false),
    ["break-defences-premium-coupon", "break-defences-perfect-coupon"],
  ],
  ["snake", snake(), ["snake-impossible-coupon"]],
  ["maze", maze(), ["maze-weekend-getaway"]],
  ["365-memories", memory(), ["memories-classified-coupon"]],
  ["relationship-minefield", mines(), []],
]) {
  const begin = await action("beginVgGameRun", [gameId, "standard"]);
  assert.equal(begin.status, "success", JSON.stringify(begin));
  const input = {
    runId: begin.runId,
    gameId,
    difficulty: "standard",
    score: 0,
    progress: 0,
    durationMs: 45000,
    ending: "defences-perfect",
    discoveredSecrets: [],
    perfectVictory: true,
    evidence,
  };
  const result = await action("finishVgGameRun", [input]);
  assert.equal(result.status, "success", JSON.stringify(result));
  assert.equal(result.won, true, gameId);
  assert.deepEqual(
    result.rewards
      .filter((r) => r.kind === "coupon")
      .map((r) => r.id)
      .sort(),
    expected.sort(),
    gameId,
  );
  const duplicate = await action("finishVgGameRun", [input]);
  assert.equal(duplicate.status, "success");
  assert.equal(duplicate.progress.wins, result.progress.wins);
  assert.ok(duplicate.rewards.every((r) => !r.newlyGranted));
  console.log(
    "PASS Next→SDK→PostgreSQL verified win/rewards/idempotent retry: " +
      gameId +
      (evidence.perfectVictory ? " (client flag ignored)" : ""),
  );
}
const state = await fetch("http://127.0.0.1:3200/rest/v1/coupon_state", {
  headers: { apikey: "archive-qa-only" },
}).then((r) => r.json());
assert.ok(!state.some((row) => row.coupon_id === "one-question-honest-answer"));
assert.ok(state.every((row) => row.redeemed_at === null));
for (const id of [
  "weekend-getaway",
  "no-budget-date",
  "classified-coupon",
  "coupon-with-no-rules",
  "evening-your-way",
])
  assert.ok(state.some((row) => row.coupon_id === id && row.unlocked_at));
console.log(
  "PASS actual action persistence: all five coupons unlocked, none redeemed, no GV-034 grant. No production data used.",
);
