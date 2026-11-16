import assert from "node:assert/strict";
import test from "node:test";

import { casinoConfig } from "../src/data/casino-config.ts";
import { casinoPrizes } from "../src/data/casino-prizes.ts";
import {
  buyPack,
  claimFinale,
  couponOdds,
  createInitialState,
  drawCouponTier,
  enterCasino,
  payDebt,
  spinSlots,
  toView,
  welcomeBonusFor,
} from "../src/features/casino/lib/engine.ts";

/** Seeded PRNG (mulberry32): fixed seeds make every run identical. */
function seeded(seed) {
  let state = seed >>> 0;
  return (maxExclusive) => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * maxExclusive);
  };
}

const N = 100_000;
const kindOf = Object.fromEntries(
  casinoPrizes.map((prize) => [prize.id, prize.kind]),
);

test("Base coupon rates over 100,000 draws match the configuration", () => {
  const rng = seeded(1);
  const counts = { common: 0, rare: 0, epic: 0, jackpot: 0 };
  for (let i = 0; i < N; i++) {
    // Past beginner's luck, no pity ramp, no welcome boost.
    const draw = drawCouponTier(
      { plays: 1000, dryPlays: 0, boosted: false, beginnerRareGiven: true },
      rng,
    );
    if (draw.tier) counts[draw.tier] += 1;
  }
  for (const tier of Object.keys(counts)) {
    const expected = casinoConfig.couponOdds[tier];
    const observed = counts[tier] / N;
    // Within ~4 standard deviations of a binomial proportion.
    const tolerance = 4 * Math.sqrt((expected * (1 - expected)) / N);
    assert.ok(
      Math.abs(observed - expected) <= tolerance,
      `${tier}: observed ${observed}, expected ${expected} ± ${tolerance}`,
    );
  }
});

test("Slot outcome rates over 100,000 spins match the configuration", () => {
  const rng = seeded(2);
  let state = createInitialState();
  let now = Date.parse("2026-11-16T10:00:00Z");
  const outcomes = {};
  let wagered = 0;
  let won = 0;
  for (let i = 0; i < N; i++) {
    now += 15_000;
    state.balance = 10_000;
    const result = spinSlots(state, 10, rng, new Date(now));
    state = result.state;
    outcomes[result.event.outcome] = (outcomes[result.event.outcome] ?? 0) + 1;
    wagered += 10;
    won += result.event.payout;
    if (result.event.disguisedLoss) {
      assert.ok(
        result.event.payout < result.event.bet && result.event.celebrated,
      );
    }
  }
  for (const outcome of casinoConfig.slots.outcomes) {
    const observed = (outcomes[outcome.id] ?? 0) / N;
    const tolerance =
      4 * Math.sqrt((outcome.probability * (1 - outcome.probability)) / N);
    assert.ok(
      Math.abs(observed - outcome.probability) <= tolerance,
      `${outcome.id}: ${observed} vs ${outcome.probability}`,
    );
  }
  // The house wins (hot streaks included), but not absurdly.
  const rtp = won / wagered;
  assert.ok(rtp > 0.6 && rtp < 1, `RTP ${rtp}`);
});

test("Pity timer: a coupon is guaranteed by the configured dry play, across 100,000 spins", () => {
  const rng = seeded(3);
  let state = createInitialState();
  let now = Date.parse("2026-11-16T10:00:00Z");
  let dry = 0;
  let maxDry = 0;
  for (let i = 0; i < N; i++) {
    now += 15_000;
    state.balance = 10_000;
    const result = spinSlots(state, 5, rng, new Date(now));
    state = result.state;
    dry = result.grants.length > 0 ? 0 : dry + 1;
    maxDry = Math.max(maxDry, dry);
  }
  assert.ok(maxDry < casinoConfig.pity.guaranteeAfter, `max dry run ${maxDry}`);

  const forced = drawCouponTier(
    {
      plays: 1000,
      dryPlays: casinoConfig.pity.guaranteeAfter - 1,
      boosted: false,
      beginnerRareGiven: true,
    },
    seeded(4),
  );
  assert.equal(forced.reason, "pity");
  assert.ok(forced.tier);

  const calm = couponOdds({ plays: 1000, dryPlays: 0, boosted: false });
  const ramped = couponOdds({ plays: 1000, dryPlays: 30, boosted: false });
  assert.ok(ramped.common > calm.common * 2);
});

test("Beginner's luck: boosted early, a rare guaranteed, then silently off", () => {
  const early = couponOdds({ plays: 0, dryPlays: 0, boosted: false });
  const late = couponOdds({
    plays: casinoConfig.beginnersLuck.plays,
    dryPlays: 0,
    boosted: false,
  });
  assert.equal(late.common, casinoConfig.couponOdds.common);
  assert.ok(
    Math.abs(
      early.common -
        casinoConfig.couponOdds.common * casinoConfig.beginnersLuck.multiplier,
    ) < 1e-9,
  );

  for (let seed = 100; seed < 400; seed++) {
    const rng = seeded(seed);
    let state = createInitialState();
    let now = Date.parse("2026-11-16T10:00:00Z");
    let rareOrBetter = false;
    for (let play = 0; play < casinoConfig.beginnersLuck.plays; play++) {
      now += 10_000;
      state.balance = 1_000;
      const result = spinSlots(state, 5, rng, new Date(now));
      state = result.state;
      if (result.grants.some((grant) => kindOf[grant.prizeId] !== "common"))
        rareOrBetter = true;
    }
    assert.ok(rareOrBetter, `seed ${seed}: no rare coupon in the first plays`);
  }
});

test("Welcome back never punishes absence", () => {
  assert.equal(welcomeBonusFor(null), casinoConfig.welcomeBack.firstVisitBonus);
  assert.equal(welcomeBonusFor(0.2), 0);
  assert.equal(welcomeBonusFor(1), casinoConfig.welcomeBack.minBonus);
  assert.equal(welcomeBonusFor(14), casinoConfig.welcomeBack.maxBonus);
  assert.equal(welcomeBonusFor(400), casinoConfig.welcomeBack.maxBonus);
  let previous = 0;
  for (let day = 1; day <= 30; day++) {
    const bonus = welcomeBonusFor(day);
    assert.ok(bonus >= previous);
    previous = bonus;
  }
});

test("Debt always equals the ledger; the finale forgives it and stays playable", () => {
  const rng = seeded(9);
  let state = createInitialState();
  let now = new Date("2026-11-16T10:00:00Z");
  let ledgerTotal = 0;
  const apply = (result) => {
    state = result.state;
    ledgerTotal += result.ledger.reduce(
      (sum, entry) => sum + entry.realKisses,
      0,
    );
    assert.equal(state.debt, ledgerTotal);
    assert.ok(state.balance >= 0);
  };
  apply(enterCasino(state, rng, now));
  apply(buyPack(state, "smooch-bundle", rng, now));
  assert.equal(
    state.balance,
    casinoConfig.startingBalance + 60 * 2,
    "first purchase doubled",
  );
  apply(buyPack(state, "royal-vault", rng, now));
  apply(payDebt(state, 20, now));
  // Interest applies at the start of a later visit when the debt is over 100.
  now = new Date(now.getTime() + 2 * 86_400_000);
  apply(enterCasino(state, rng, now));
  assert.ok(state.debt > 155);
  assert.throws(() => claimFinale(state, now));
  state.curtain.unlocked = true;
  const finale = claimFinale(state, now);
  apply(finale);
  assert.equal(state.debt, 0);
  assert.equal(finale.grants[0].prizeId, "house-always-loses");
  assert.throws(() => claimFinale(state, now));
  const view = toView(state, now);
  assert.equal("debt" in view, false, "the casino view never shows the debt");
  apply(spinSlots(state, 5, rng, now));
});
