import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { casinoConfig } from "../src/data/casino-config.ts";
import { casinoPrizes } from "../src/data/casino-prizes.ts";
import {
  blackjackDeal,
  blackjackHit,
  blackjackStand,
  buyPack,
  claimPassTier,
  createInitialState,
  doubleOrNothing,
  enterCasino,
  finishWelcome,
  handTotal,
  pocketColor,
  resetCasino,
  spinRoulette,
  spinSlots,
  toView,
} from "../src/features/casino/lib/engine.ts";

function seeded(seed) {
  let state = seed >>> 0;
  return (maxExclusive) => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * maxExclusive);
  };
}

const kindOf = Object.fromEntries(casinoPrizes.map((p) => [p.id, p.kind]));
const START = Date.parse("2026-11-16T10:00:00Z");
const within = (observed, expected, n) =>
  Math.abs(observed - expected) <=
  4 * Math.sqrt((expected * (1 - expected)) / n);

function playHand(state, rng, now, bet = 10) {
  let result = blackjackDeal(state, bet, rng, now);
  const grants = [...result.grants];
  while (result.event.phase === "playing") {
    result =
      result.event.hand.playerTotal < 17
        ? blackjackHit(result.state, rng, now)
        : blackjackStand(result.state, rng, now);
    grants.push(...result.grants);
  }
  return { ...result, grants };
}

test("Roulette over 100,000 spins: pocket rates, house edge and the epic on 31", () => {
  const rng = seeded(11);
  let state = createInitialState();
  const N = 100_000;
  let reds = 0;
  let wagered = 0;
  let won = 0;
  for (let i = 0; i < N; i++) {
    state.balance = 1_000_000;
    const r = spinRoulette(
      state,
      10,
      { kind: "color", value: "red" },
      rng,
      new Date(START + i * 15_000),
    );
    state = r.state;
    wagered += 10;
    won += r.event.payout;
    if (r.event.color === "red") reds += 1;
    assert.equal(r.event.won, pocketColor(r.event.pocket) === "red");
  }
  assert.ok(within(reds / N, 18 / 37, N), `red rate ${reds / N}`);
  assert.ok(won / wagered < 0.9, `even-money return ${won / wagered}`);

  const r31 = (() => {
    const rng31 = seeded(12);
    let s = createInitialState();
    for (let i = 0; i < 5_000; i++) {
      s.balance = 1_000_000;
      const r = spinRoulette(
        s,
        10,
        { kind: "number", value: 31 },
        rng31,
        new Date(START + i * 15_000),
      );
      s = r.state;
      if (r.event.pocket === 31) return r;
    }
    return null;
  })();
  assert.ok(r31, "31 eventually lands");
  assert.ok(
    r31.grants.some((g) => kindOf[g.prizeId] === "epic"),
    "31 wins an epic coupon",
  );
});

test("Blackjack: naturals win a rare coupon; the house keeps an edge", () => {
  const rng = seeded(21);
  let state = createInitialState();
  const N = 40_000;
  let naturals = 0;
  let wagered = 0;
  let won = 0;
  for (let i = 0; i < N; i++) {
    state.balance = 1_000_000;
    const r = playHand(state, rng, new Date(START + i * 15_000));
    state = r.state;
    assert.equal(state.blackjack, null, "every hand settles");
    wagered += 10;
    won += r.event.play.payout;
    if (r.event.outcome === "natural") {
      naturals += 1;
      assert.ok(
        r.grants.some((g) => kindOf[g.prizeId] === "rare"),
        "natural → rare coupon",
      );
      assert.equal(handTotal(r.event.hand.player), 21);
    }
  }
  // Infinite deck: P(natural) = 2 × 1/13 × 4/13 ≈ 4.7%
  assert.ok(within(naturals / N, 8 / 169, N), `natural rate ${naturals / N}`);
  assert.ok(won / wagered < 1, `blackjack return ${won / wagered}`);
  // The dealer's hole card stays hidden in the view while playing.
  const live = blackjackDeal(
    createInitialState(),
    10,
    seeded(3),
    new Date(START),
  );
  if (live.event.phase === "playing") {
    assert.equal(toView(live.state, new Date(START)).blackjack.dealer[1], null);
  }
});

test("Coin toss: heads at the configured rate", () => {
  const rng = seeded(31);
  const N = 50_000;
  let heads = 0;
  for (let i = 0; i < N; i++) {
    const now = new Date(START + i);
    const state = enterCasino(createInitialState(), rng, now).state;
    state.pendingDouble = { amount: 10 };
    const r = doubleOrNothing(state, rng, now);
    if (r.event.face === "heads") heads += 1;
    assert.equal(r.event.face === "heads", r.event.won);
  }
  assert.ok(
    within(heads / N, casinoConfig.doubleOrNothing.winChance, N),
    `heads ${heads / N}`,
  );
});

test("Slot reels always match the outcome and coupon tier", () => {
  const rng = seeded(41);
  let state = createInitialState();
  for (let i = 0; i < 20_000; i++) {
    state.balance = 100_000;
    const r = spinSlots(state, 10, rng, new Date(START + i * 15_000));
    state = r.state;
    const { grid, lines } = r.event;
    assert.equal(grid.length, 5);
    for (const reel of grid) assert.equal(reel.length, 3);
    for (const line of lines) {
      for (let reel = 0; reel < line.length; reel++)
        assert.equal(grid[reel][line.row], line.symbol);
      if (line.couponTier)
        assert.equal(
          line.symbol,
          casinoConfig.slots.couponSymbols[line.couponTier],
        );
    }
    const paying = lines.filter((line) => !line.couponTier);
    assert.equal(
      paying.length > 0,
      r.event.payout > 0,
      `spin ${i}: lines vs payout`,
    );
  }
});

test("A typical visit keeps its rhythm and the house edge", () => {
  // 2,000 visits of 30 plays: 20 slot spins, 5 roulette, 5 blackjack hands.
  const rng = seeded(51);
  let state = createInitialState();
  state.stats.plays = 500;
  state.beginnerRareGiven = true;
  let now = START;
  let wagered = 0;
  let won = 0;
  const tiers = {};
  for (let visit = 0; visit < 2_000; visit++) {
    now += 3 * 86_400_000;
    for (let play = 0; play < 30; play++) {
      now += 20_000;
      state.balance = 100_000;
      let r;
      if (play < 20) {
        r = spinSlots(state, 5, rng, new Date(now));
        won += r.event.payout;
      } else if (play < 25) {
        r = spinRoulette(
          state,
          5,
          { kind: "color", value: "black" },
          rng,
          new Date(now),
        );
        won += r.event.payout;
      } else {
        r = playHand(state, rng, new Date(now), 5);
        won += r.event.play.payout;
      }
      wagered += 5;
      state = r.state;
      for (const g of r.grants)
        tiers[kindOf[g.prizeId]] = (tiers[kindOf[g.prizeId]] ?? 0) + 1;
    }
  }
  const perVisit = (tier) => (tiers[tier] ?? 0) / 2_000;
  assert.ok(
    perVisit("common") > 1.5 && perVisit("common") < 3,
    `common ${perVisit("common")}`,
  );
  assert.ok(
    perVisit("rare") > 0.5 && perVisit("rare") < 1.3,
    `rare ${perVisit("rare")}`,
  );
  assert.ok(won / wagered < 0.9, `overall return ${won / wagered}`);
});

test("Kiss Pass unlocks tiers with plays and pays them once", () => {
  const rng = seeded(61);
  let state = enterCasino(createInitialState(), rng, new Date(START)).state;
  assert.throws(() => claimPassTier(state, rng, new Date(START)));
  for (let i = 0; i < casinoConfig.kissPass.playsPerTier; i++) {
    state.balance = 1_000;
    state = spinSlots(state, 5, rng, new Date(START + i * 1_000)).state;
  }
  const before = state.balance;
  state = claimPassTier(state, rng, new Date(START + 10_000)).state;
  assert.equal(state.balance, before + casinoConfig.kissPass.rewards[0]);
  assert.throws(() => claimPassTier(state, rng, new Date(START + 11_000)));
});

test("Reset: a fresh season as if the casino had never been used", () => {
  const rng = seeded(71);
  let state = enterCasino(createInitialState(), rng, new Date(START)).state;
  state = finishWelcome(state).state;
  state = buyPack(state, "smooch-bundle", rng, new Date(START)).state;
  for (let i = 0; i < 60; i++) {
    state.balance = 1_000;
    state = spinSlots(state, 25, rng, new Date(START + i * 1_000)).state;
  }
  state.piggy = 77;
  state.curtain.unlocked = true;
  assert.ok(state.nextCode > 1, "some coupons were won");

  const fresh = resetCasino(state);
  const initial = createInitialState();
  assert.equal(fresh.season, state.season + 1);
  assert.equal(fresh.nextCode, state.nextCode, "coupon codes never repeat");
  assert.equal(fresh.balance, casinoConfig.startingBalance);
  assert.equal(fresh.onboarded, false, "the welcome tour returns");
  assert.equal(
    fresh.debt,
    casinoConfig.reset.resetDebtOnReset ? 0 : state.debt,
  );
  for (const key of [
    "dryPlays",
    "beginnerRareGiven",
    "firstPurchaseUsed",
    "vipLevel",
    "piggy",
    "collected",
    "completedSets",
    "hot",
    "pendingDouble",
    "curtain",
    "stats",
    "visit",
    "pass",
    "blackjack",
    "jackpotPool",
    "lastFreeWheelAt",
  ]) {
    assert.deepEqual(
      fresh[key],
      initial[key],
      `${key} is back to its initial value`,
    );
  }
});

test("The season migration archives the ledger and never deletes it", () => {
  const sql = readFileSync(
    "supabase/migrations/20261116212951_kiss_casino_seasons.sql",
    "utf8",
  );
  assert.ok(!/\bdelete\s+from\b/i.test(sql), "no DELETE in the migration");
  assert.ok(!/\bdrop\s+(table|column)\b/i.test(sql), "nothing dropped");
  assert.match(sql, /add column season/);
  assert.match(sql, /redeem_casino_coupon_with_reset/);
  assert.match(sql, /coupon_already_redeemed/, "each coupon works once");
  assert.match(
    sql,
    /revoke all on function public\.redeem_casino_coupon_with_reset/,
  );
});
