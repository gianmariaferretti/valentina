import assert from "node:assert/strict";
import test from "node:test";
import { ARCADE } from "../src/data/arcade-config.ts";
import { vgGames } from "../src/data/games.ts";
import { coupons } from "../src/data/coupons.ts";
import { evaluateGameResult } from "../src/features/games/lib/game-domain.ts";
import {
  resolveCoupon,
  createWalletItem,
} from "../src/features/coupons/lib/coupon-domain.ts";
import {
  createSnakeState,
  snakeSafeCycle,
  snakeObstacles,
  queueSnakeDirection,
  stepSnake,
} from "../src/features/games/lib/snake-domain.ts";
import {
  createDefenceState,
  stepDefence,
} from "../src/features/games/break-defences/arcade-domain.ts";
import { verifyArcadeResult } from "../src/features/games/lib/verify-arcade-result.ts";

test("Snake: seeded obstacles move, escalate, never enter food/body, and 40 seeds remain legitimately winnable", () => {
  assert.equal(ARCADE.snake.size, 24);
  const cycle = snakeSafeCycle();
  assert.equal(new Set(cycle).size, cycle.length);
  assert.ok(cycle.length > ARCADE.snake.target + 3);
  for (let i = 0; i < cycle.length; i++) {
    const next = cycle[(i + 1) % cycle.length];
    assert.equal(
      Math.abs((next % 24) - (cycle[i] % 24)) +
        Math.abs(Math.floor(next / 24) - Math.floor(cycle[i] / 24)),
      1,
    );
  }
  for (let seed = 0; seed < 40; seed++) {
    const state = createSnakeState(seed),
      initial = [...state.staticObstacles];
    const positions = state.movingObstacles.map((o) => o.position);
    assert.deepEqual(initial, [...createSnakeState(seed).staticObstacles]);
    state.status = "playing";
    let moved = false,
      ticks = 0;
    while (state.status === "playing" && ticks++ < 30000) {
      const next = cycle[(cycle.indexOf(state.body[0]) + 1) % cycle.length];
      const delta = next - state.body[0];
      queueSnakeDirection(
        state,
        delta === 1 ? 1 : delta === -1 ? 3 : delta === 24 ? 2 : 0,
      );
      stepSnake(state);
      const obstacles = snakeObstacles(state);
      assert.ok(!obstacles.has(state.food));
      assert.ok(state.body.every((cell) => !obstacles.has(cell)));
      moved ||= state.movingObstacles.some(
        (o, i) => o.position !== positions[i],
      );
    }
    assert.equal(state.status, "won", "seed " + seed);
    assert.equal(state.score, 75);
    assert.ok(moved);
    assert.ok(state.staticObstacles.size > initial.length);
  }
});

test("Snake: static and moving obstacles really collide; new obstacles do not materialize near the head", () => {
  for (const moving of [false, true]) {
    const state = createSnakeState(4);
    state.status = "playing";
    state.body = [100, 99, 98];
    state.food = 25;
    state.staticObstacles = new Set(moving ? [] : [101]);
    state.obstacleCandidates = [];
    state.movingObstacles = moving ? [{ pair: [101, 125], position: 101 }] : [];
    stepSnake(state);
    assert.equal(state.status, "lost");
  }
  const state = createSnakeState(3);
  state.status = "playing";
  state.body = [100, 99, 98];
  state.score = 60;
  state.staticObstacles.clear();
  state.movingObstacles = [];
  state.obstacleCandidates = [101, 102, 124, 200];
  stepSnake(state);
  assert.ok(!state.staticObstacles.has(101));
  assert.ok(state.staticObstacles.has(200));
  assert.equal(state.status, "playing");
});

function breakoutTranscript(loseFirstLife) {
  const state = createDefenceState(),
    inputs = [];
  while (!["lost", "victory"].includes(state.mode) && inputs.length < 180000) {
    let target = 210;
    if (state.ball.vy > 0) {
      let x =
        state.ball.x + (state.ball.vx * (510 - state.ball.y)) / state.ball.vy;
      x = (((x - 6) % 816) + 816) % 816;
      if (x > 408) x = 816 - x;
      target = x + 6 + Math.sin(state.elapsed * 0.713) * 20;
      if (loseFirstLife && state.lives === 3) target = x > 204 ? 34 : 386;
    }
    target = Math.round(Math.max(34, Math.min(386, target)) * 100) / 100;
    const launch = state.mode === "serve";
    inputs.push(Math.round(target * 100) + (launch ? 100000 : 0));
    stepDefence(state, target, launch, true);
  }
  assert.equal(state.mode, "victory");
  assert.equal(state.lives, loseFirstLife ? 2 : 3);
  return { seed: 0, inputs, perfectVictory: true };
}
test("Breakout: server replays BOTH normal and perfect victories, ignoring a forged perfectVictory flag", () => {
  const game = vgGames.find((g) => g.gameId === "break-defences");
  for (const lost of [false, true]) {
    const result = verifyArcadeResult(game.gameId, breakoutTranscript(lost), 0);
    assert.equal(
      result.ending,
      lost ? "defences-breached" : "defences-perfect",
    );
    const grants = evaluateGameResult(game, result)
      .rewards.filter((r) => r.kind === "coupon")
      .map((r) => r.targetId);
    assert.ok(grants.includes("evening-your-way"));
    assert.equal(grants.includes("no-budget-date"), !lost);
  }
});
test("Coupon mappings: no active GV-034, all new grants victory-only, exact GV-033 copy", () => {
  assert.equal(
    coupons.some((c) => c.code === "GV-034"),
    false,
  );
  assert.equal(
    vgGames
      .find((g) => g.gameId === "relationship-minefield")
      .rewards.some((r) => r.kind === "coupon"),
    false,
  );
  for (const [gameId, code] of [
    ["snake", "GV-035"],
    ["maze", "GV-026"],
    ["365-memories", "GV-033"],
    ["break-defences", "GV-036"],
  ]) {
    const game = vgGames.find((g) => g.gameId === gameId);
    const coupon = coupons.find((c) => c.code === code);
    assert.equal(coupon.challengeId, gameId);
    assert.ok(
      game.rewards.some((r) => r.kind === "coupon" && r.targetId === coupon.id),
    );
    assert.equal(
      evaluateGameResult(game, {
        score: 0,
        progress: 99,
        ending: game.allowedEndings.at(-1),
      }).rewards.length,
      0,
    );
  }
  const classified = coupons.find((c) => c.code === "GV-033");
  assert.equal(classified.shortDescription, "A Surprise of My Choosing");
  assert.equal(
    classified.description,
    "A classified surprise planned entirely by Gianmaria. The details remain secret until the surprise is revealed.",
  );
});
test("Historical coupon unlocks/redemptions take precedence over corrected locked definitions", () => {
  for (const code of [
    "GV-026",
    "GV-031",
    "GV-032",
    "GV-033",
    "GV-035",
    "GV-036",
  ]) {
    const coupon = coupons.find((c) => c.code === code);
    const unlocked = {
      version: 1,
      unlockedCouponIds: [coupon.id],
      redemptions: [],
    };
    assert.equal(resolveCoupon(coupon, unlocked).status, "available");
    const redeemed = resolveCoupon(coupon, {
      ...unlocked,
      redemptions: [
        { couponId: coupon.id, redeemedAt: "2026-01-01T12:00:00Z" },
      ],
    });
    assert.equal(redeemed.status, "redeemed");
    assert.equal(createWalletItem(redeemed).href, "/coupons/" + coupon.id);
    assert.equal(createWalletItem(redeemed).callToAction, "VIEW COUPON");
    assert.equal(redeemed.redeemedAt, "2026-01-01T12:00:00Z");
  }
});
