/**
 * Kiss Casino engine. Pure and deterministic given an `Rng`, so the server can
 * use `crypto.randomInt` and tests can replay 100,000 seeded spins.
 * Imports use relative `.ts` paths so Node's test runner can load this file.
 */
import {
  casinoConfig as config,
  prizeTiers,
  type MissionMetric,
  type PrizeTier,
  type ScratchTier,
} from "../../../data/casino-config.ts";
import {
  casinoPrizes,
  casinoSets,
  getCasinoPrize,
  type CasinoPrize,
} from "../../../data/casino-prizes.ts";

/** Returns an integer in [0, maxExclusive). */
export type Rng = (maxExclusive: number) => number;

const RESOLUTION = 1_000_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const KISS = "💋";
const SEVEN = "7️⃣";

export function chance(rng: Rng, probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return rng(RESOLUTION) < Math.round(probability * RESOLUTION);
}

function pickIndex(rng: Rng, length: number): number {
  return rng(length);
}

function pickWeighted<T>(
  rng: Rng,
  items: readonly T[],
  weight: (item: T) => number,
): T {
  const scaled = items.map((item) =>
    Math.max(0, Math.round(weight(item) * 1000)),
  );
  const total = scaled.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return items[pickIndex(rng, items.length)];
  let roll = rng(total);
  for (let index = 0; index < items.length; index++) {
    roll -= scaled[index];
    if (roll < 0) return items[index];
  }
  return items[items.length - 1];
}

// ---------------------------------------------------------------- State

export type MissionId = (typeof config.missions.pool)[number]["id"];

export interface CasinoStats {
  plays: number;
  slotSpins: number;
  scratches: number;
  wheelSpins: number;
  doubles: number;
  wagered: number;
  kissesWon: number;
  couponsWon: number;
  jackpots: number;
  nearMisses: number;
  disguisedLosses: number;
  packsBought: number;
  realKissesBought: number;
  realKissesPaid: number;
  piggyBreaks: number;
  biggestWin: number;
  beginnerCoupons: number;
  pityCoupons: number;
  visits: number;
}

export interface CasinoVisit {
  id: string;
  startedAt: string;
  welcomeBonus: number;
  welcomeClaimed: boolean;
  daysAway: number | null;
  boostPlaysLeft: number;
  missions: { id: MissionId; claimed: boolean }[];
  metrics: Record<MissionMetric, number>;
  flashDeal: { id: string; expiresAt: string; used: boolean } | null;
  beat: {
    herWins: number;
    hisWins: number;
    spins: number;
    status: "open" | "won" | "lost";
  };
}

export interface CasinoState {
  v: 1;
  balance: number;
  /** Real kisses owed to Gianmaria. Never shown inside the casino. */
  debt: number;
  piggy: number;
  dryPlays: number;
  beginnerRareGiven: boolean;
  firstPurchaseUsed: boolean;
  vipLevel: number;
  nextCode: number;
  lastActivityAt: string | null;
  lastFreeWheelAt: string | null;
  lastInterestAt: string | null;
  collected: string[];
  completedSets: string[];
  hot: { streak: number; boosted: number };
  pendingDouble: { amount: number } | null;
  curtain: { unlocked: boolean; finaleClaimed: boolean };
  stats: CasinoStats;
  recentWins: { text: string; at: string }[];
  visit: CasinoVisit | null;
}

export interface CouponGrant {
  couponId: string;
  code: string;
  prizeId: string;
  setting: CasinoPrize["setting"];
  wonAt: string;
}

export type LedgerKind =
  "purchase" | "piggy" | "interest" | "payment" | "forgiven";

export interface LedgerEntry {
  kind: LedgerKind;
  /** Positive adds to the real-kiss debt; negative pays it down. */
  realKisses: number;
  chips: number;
  label: string;
  at: string;
}

export interface CouponWin {
  couponId: string;
  code: string;
  prizeId: string;
  title: string;
  tier: CasinoPrize["kind"];
  reason: "luck" | "beginner" | "pity" | "beat" | "ticket" | "set" | "finale";
}

/** Everything the interface needs to celebrate (or quietly skip) a result. */
export interface PlayEvent {
  bet: number;
  payout: number;
  /** Payout greater than zero: lights, sound and "WIN!". */
  celebrated: boolean;
  /** Celebrated even though it paid less than the bet. */
  disguisedLoss: boolean;
  bigWin: boolean;
  nearMiss: boolean;
  hotStreakStarted: boolean;
  hotMultiplied: boolean;
  coupons: CouponWin[];
  levelUp: { label: string; bonus: number } | null;
  curtainUnlocked: boolean;
  beat: CasinoVisit["beat"] | null;
}

export interface SlotEvent extends PlayEvent {
  kind: "slots";
  /** Three reels, each [above, centre, below]. */
  reels: string[][];
  outcome: string;
  nearMissReel: { reel: number; position: "above" | "below" } | null;
}

export interface ScratchEvent extends PlayEvent {
  kind: "scratch";
  tier: ScratchTier;
  cells: string[];
  winningSymbol: string | null;
  almostIndex: number | null;
}

export interface WheelEvent extends PlayEvent {
  kind: "wheel";
  free: boolean;
  segment: number;
  /** Where inside the segment the pointer stops, 0–1 clockwise. */
  offset: number;
}

export interface DoubleEvent {
  kind: "double";
  won: boolean;
  amount: number;
}

export type CasinoEvent =
  | SlotEvent
  | ScratchEvent
  | WheelEvent
  | DoubleEvent
  | { kind: "purchase"; chips: number; realKisses: number; doubled: boolean }
  | { kind: "piggy"; chips: number; realKisses: number }
  | { kind: "claim"; chips: number; label: string }
  | { kind: "payment"; realKisses: number }
  | { kind: "finale"; coupons: CouponWin[]; forgiven: number }
  | { kind: "enter" };

export interface StepResult {
  state: CasinoState;
  event: CasinoEvent;
  grants: CouponGrant[];
  ledger: LedgerEntry[];
}

export class CasinoRuleError extends Error {}

const emptyMetrics = (): Record<MissionMetric, number> => ({
  slotSpins: 0,
  scratches: 0,
  coupons: 0,
  wheelSpins: 0,
  doubles: 0,
  wagered: 0,
});

export function createInitialState(): CasinoState {
  return {
    v: 1,
    balance: config.startingBalance,
    debt: 0,
    piggy: 0,
    dryPlays: 0,
    beginnerRareGiven: false,
    firstPurchaseUsed: false,
    vipLevel: 0,
    nextCode: 1,
    lastActivityAt: null,
    lastFreeWheelAt: null,
    lastInterestAt: null,
    collected: [],
    completedSets: [],
    hot: { streak: 0, boosted: 0 },
    pendingDouble: null,
    curtain: { unlocked: false, finaleClaimed: false },
    stats: {
      plays: 0,
      slotSpins: 0,
      scratches: 0,
      wheelSpins: 0,
      doubles: 0,
      wagered: 0,
      kissesWon: 0,
      couponsWon: 0,
      jackpots: 0,
      nearMisses: 0,
      disguisedLosses: 0,
      packsBought: 0,
      realKissesBought: 0,
      realKissesPaid: 0,
      piggyBreaks: 0,
      biggestWin: 0,
      beginnerCoupons: 0,
      pityCoupons: 0,
      visits: 0,
    },
    recentWins: [],
    visit: null,
  };
}

/** Accepts stored JSON and fills fields added by later versions. */
export function normalizeState(value: unknown): CasinoState {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const stored = value as Partial<CasinoState>;
  return {
    ...initial,
    ...stored,
    stats: { ...initial.stats, ...(stored.stats ?? {}) },
    hot: { ...initial.hot, ...(stored.hot ?? {}) },
    curtain: { ...initial.curtain, ...(stored.curtain ?? {}) },
    collected: Array.isArray(stored.collected) ? stored.collected : [],
    completedSets: Array.isArray(stored.completedSets)
      ? stored.completedSets
      : [],
    recentWins: Array.isArray(stored.recentWins) ? stored.recentWins : [],
    v: 1,
  };
}

function clone(state: CasinoState): CasinoState {
  return structuredClone(state);
}

// ---------------------------------------------------------------- Visits

export function welcomeBonusFor(daysAway: number | null): number {
  const rules = config.welcomeBack;
  if (daysAway === null) return rules.firstVisitBonus;
  if (daysAway < rules.minDays) return 0;
  const progress = Math.min(
    1,
    (daysAway - rules.minDays) / (rules.maxDays - rules.minDays),
  );
  return Math.round(
    rules.minBonus + (rules.maxBonus - rules.minBonus) * progress,
  );
}

function isVisitStale(state: CasinoState, now: Date): boolean {
  if (!state.visit || !state.lastActivityAt) return true;
  return (
    now.getTime() - new Date(state.lastActivityAt).getTime() >
    config.visitGapMinutes * 60_000
  );
}

function startVisit(
  state: CasinoState,
  rng: Rng,
  now: Date,
  ledger: LedgerEntry[],
): void {
  const daysAway = state.lastActivityAt
    ? (now.getTime() - new Date(state.lastActivityAt).getTime()) / DAY_MS
    : null;
  const pool = [...config.missions.pool];
  const missions: CasinoVisit["missions"] = [];
  while (missions.length < config.missions.perVisit && pool.length > 0) {
    const [mission] = pool.splice(pickIndex(rng, pool.length), 1);
    missions.push({ id: mission.id, claimed: false });
  }
  const deal =
    config.shop.flashDeals[pickIndex(rng, config.shop.flashDeals.length)];
  state.visit = {
    id: `visit-${now.getTime().toString(36)}-${rng(1e9).toString(36)}`,
    startedAt: now.toISOString(),
    welcomeBonus: welcomeBonusFor(daysAway),
    welcomeClaimed: false,
    daysAway: daysAway === null ? null : Math.floor(daysAway),
    boostPlaysLeft:
      daysAway !== null && daysAway >= config.welcomeBack.minDays
        ? config.welcomeBack.boostPlays
        : 0,
    missions,
    metrics: emptyMetrics(),
    flashDeal: {
      id: deal.id,
      expiresAt: new Date(
        now.getTime() + config.shop.flashDealMinutes * 60_000,
      ).toISOString(),
      used: false,
    },
    beat: { herWins: 0, hisWins: 0, spins: 0, status: "open" },
  };
  state.pendingDouble = null;
  state.hot = { streak: 0, boosted: 0 };
  state.stats.visits += 1;
  applyInterest(state, now, ledger);
}

function applyInterest(state: CasinoState, now: Date, ledger: LedgerEntry[]) {
  const rules = config.debtInterest;
  if (state.debt <= rules.threshold) return;
  if (
    state.lastInterestAt &&
    now.getTime() - new Date(state.lastInterestAt).getTime() <
      rules.everyHours * HOUR_MS
  )
    return;
  const interest = Math.ceil(state.debt * rules.rate);
  state.debt += interest;
  state.lastInterestAt = now.toISOString();
  ledger.push({
    kind: "interest",
    realKisses: interest,
    chips: 0,
    label: `Interest on a debt over ${rules.threshold}`,
    at: now.toISOString(),
  });
}

/** Starts a new visit when needed and records activity. */
function begin(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): { state: CasinoState; ledger: LedgerEntry[]; grants: CouponGrant[] } {
  const state = clone(previous);
  const ledger: LedgerEntry[] = [];
  if (isVisitStale(state, now)) startVisit(state, rng, now, ledger);
  state.lastActivityAt = now.toISOString();
  return { state, ledger, grants: [] };
}

export function enterCasino(
  state: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const step = begin(state, rng, now);
  return { ...step, event: { kind: "enter" } };
}

// ---------------------------------------------------------------- Coupons

export interface OddsContext {
  /** Lifetime plays before this one. */
  plays: number;
  dryPlays: number;
  boosted: boolean;
  multiplier?: number;
}

export function couponOdds(context: OddsContext): Record<PrizeTier, number> {
  const beginner = context.plays + 1 <= config.beginnersLuck.plays;
  const pityRamp = Math.max(0, context.dryPlays + 1 - config.pity.rampStart);
  const factor =
    (context.multiplier ?? 1) *
    (beginner ? config.beginnersLuck.multiplier : 1) *
    (context.boosted ? config.welcomeBack.boostMultiplier : 1) *
    (1 + config.pity.rampPerPlay * pityRamp);
  const odds = {} as Record<PrizeTier, number>;
  for (const tier of prizeTiers) odds[tier] = config.couponOdds[tier] * factor;
  const total = prizeTiers.reduce((sum, tier) => sum + odds[tier], 0);
  if (total > 0.95)
    for (const tier of prizeTiers) odds[tier] = (odds[tier] / total) * 0.95;
  return odds;
}

function pickTierByWeights(
  rng: Rng,
  weights: Record<PrizeTier, number>,
  allowed: readonly PrizeTier[] = prizeTiers,
): PrizeTier {
  return pickWeighted(rng, allowed, (tier) => weights[tier]);
}

export interface TierDraw {
  tier: PrizeTier | null;
  reason: "luck" | "beginner" | "pity" | null;
}

/** One coupon roll for a play. Exported for the odds tests. */
export function drawCouponTier(
  context: OddsContext & { beginnerRareGiven: boolean },
  rng: Rng,
): TierDraw {
  const playNumber = context.plays + 1;
  if (playNumber === config.beginnersLuck.plays && !context.beginnerRareGiven) {
    return {
      tier: pickTierByWeights(rng, config.couponOdds, [
        "rare",
        "epic",
        "jackpot",
      ]),
      reason: "beginner",
    };
  }
  if (context.dryPlays + 1 >= config.pity.guaranteeAfter) {
    return { tier: pickTierByWeights(rng, config.couponOdds), reason: "pity" };
  }
  const odds = couponOdds(context);
  let roll = rng(RESOLUTION) / RESOLUTION;
  for (const tier of ["jackpot", "epic", "rare", "common"] as const) {
    roll -= odds[tier];
    if (roll < 0)
      return {
        tier,
        reason: playNumber <= config.beginnersLuck.plays ? "beginner" : "luck",
      };
  }
  return { tier: null, reason: null };
}

function code(number: number) {
  const padded = String(number).padStart(3, "0");
  return { couponId: `casino-c${padded}`, code: `GV-C${padded}` };
}

function grantPrize(
  state: CasinoState,
  prize: CasinoPrize,
  reason: CouponWin["reason"],
  now: Date,
  grants: CouponGrant[],
): CouponWin[] {
  const ids = code(state.nextCode);
  state.nextCode += 1;
  grants.push({
    ...ids,
    prizeId: prize.id,
    setting: prize.setting,
    wonAt: now.toISOString(),
  });
  state.stats.couponsWon += 1;
  if (prize.kind === "jackpot") state.stats.jackpots += 1;
  if (state.visit) state.visit.metrics.coupons += 1;
  state.recentWins = [
    { text: `Valentina won ${prize.title}.`, at: now.toISOString() },
    ...state.recentWins,
  ].slice(0, 8);
  const wins: CouponWin[] = [
    { ...ids, prizeId: prize.id, title: prize.title, tier: prize.kind, reason },
  ];
  if (!state.collected.includes(prize.id)) state.collected.push(prize.id);
  for (const set of casinoSets) {
    if (state.completedSets.includes(set.id)) continue;
    const pieces = casinoPrizes.filter((item) => item.setId === set.id);
    if (pieces.every((piece) => state.collected.includes(piece.id))) {
      state.completedSets.push(set.id);
      const bonus = getCasinoPrize(set.bonusPrizeId);
      if (bonus) wins.push(...grantPrize(state, bonus, "set", now, grants));
    }
  }
  return wins;
}

function grantTier(
  state: CasinoState,
  tier: PrizeTier,
  reason: CouponWin["reason"],
  rng: Rng,
  now: Date,
  grants: CouponGrant[],
): CouponWin[] {
  const candidates = casinoPrizes.filter((prize) => prize.kind === tier);
  const prize = pickWeighted(rng, candidates, (item) => item.weight);
  if (tier !== "common") state.beginnerRareGiven = true;
  return grantPrize(state, prize, reason, now, grants);
}

// ---------------------------------------------------------------- Plays

interface PlayInput {
  bet: number;
  basePayout: number;
  bigWin: boolean;
  nearMiss: boolean;
  couponMultiplier: number;
  /** A coupon of one of these tiers is guaranteed (wheel ticket). */
  forcedTiers?: Record<PrizeTier, number>;
  metric: MissionMetric;
}

function vipLevelFor(wagered: number): number {
  let level = 0;
  config.vipLevels.forEach((entry, index) => {
    if (wagered >= entry.threshold) level = index;
  });
  return level;
}

function settlePlay(
  state: CasinoState,
  input: PlayInput,
  rng: Rng,
  now: Date,
  grants: CouponGrant[],
): PlayEvent {
  const visit = state.visit;
  state.balance -= input.bet;
  state.stats.wagered += input.bet;
  if (visit) {
    visit.metrics.wagered += input.bet;
    visit.metrics[input.metric] += 1;
  }
  if (input.bet > 0)
    state.piggy += Math.max(1, Math.ceil(input.bet * config.piggy.share));

  let payout = input.basePayout;
  const hotMultiplied = state.hot.boosted > 0 && payout > 0;
  if (state.hot.boosted > 0) {
    if (payout > 0) payout *= config.hotStreak.multiplier;
    state.hot.boosted -= 1;
  }
  state.balance += payout;
  state.stats.kissesWon += payout;
  state.stats.biggestWin = Math.max(state.stats.biggestWin, payout);

  let hotStreakStarted = false;
  if (payout > 0) {
    state.hot.streak += 1;
    if (
      state.hot.streak >= config.hotStreak.winsNeeded &&
      state.hot.boosted === 0
    ) {
      state.hot = { streak: 0, boosted: config.hotStreak.plays };
      hotStreakStarted = true;
    }
  } else state.hot.streak = 0;

  state.pendingDouble = payout > 0 ? { amount: payout } : null;
  const disguisedLoss = payout > 0 && payout < input.bet;
  if (disguisedLoss) state.stats.disguisedLosses += 1;
  if (input.nearMiss) state.stats.nearMisses += 1;

  const context = {
    plays: state.stats.plays,
    dryPlays: state.dryPlays,
    boosted: (visit?.boostPlaysLeft ?? 0) > 0,
    multiplier: input.couponMultiplier,
    beginnerRareGiven: state.beginnerRareGiven,
  };
  let coupons: CouponWin[] = [];
  if (input.forcedTiers) {
    const tier = pickTierByWeights(rng, input.forcedTiers);
    coupons = grantTier(state, tier, "ticket", rng, now, grants);
  } else {
    const draw = drawCouponTier(context, rng);
    if (draw.tier && draw.reason) {
      coupons = grantTier(state, draw.tier, draw.reason, rng, now, grants);
      if (draw.reason === "beginner") state.stats.beginnerCoupons += 1;
      if (draw.reason === "pity") state.stats.pityCoupons += 1;
    }
  }
  state.dryPlays = coupons.length > 0 ? 0 : state.dryPlays + 1;
  state.stats.plays += 1;
  if (visit && visit.boostPlaysLeft > 0) visit.boostPlaysLeft -= 1;

  let levelUp: PlayEvent["levelUp"] = null;
  const level = vipLevelFor(state.stats.wagered);
  if (level > state.vipLevel) {
    let bonus = 0;
    for (let index = state.vipLevel + 1; index <= level; index++)
      bonus += config.vipLevels[index].bonus;
    state.vipLevel = level;
    state.balance += bonus;
    levelUp = { label: config.vipLevels[level].label, bonus };
  }

  const curtainUnlocked = updateCurtain(state);
  if (payout >= input.bet * 10 && payout > 0)
    state.recentWins = [
      { text: `Valentina won ${payout} 💋.`, at: now.toISOString() },
      ...state.recentWins,
    ].slice(0, 8);

  return {
    bet: input.bet,
    payout,
    celebrated: payout > 0,
    disguisedLoss,
    bigWin: input.bigWin,
    nearMiss: input.nearMiss,
    hotStreakStarted,
    hotMultiplied,
    coupons,
    levelUp,
    curtainUnlocked,
    beat: null,
  };
}

function updateCurtain(state: CasinoState): boolean {
  if (state.curtain.unlocked) return false;
  const required = config.vipLevels.findIndex(
    (level) => level.id === config.curtain.unlockVipLevel,
  );
  if (state.vipLevel >= required || state.stats.jackpots > 0) {
    state.curtain.unlocked = true;
    return true;
  }
  return false;
}

function requireBalance(state: CasinoState, amount: number) {
  if (state.balance < amount)
    throw new CasinoRuleError("Not enough 💋. The Kiss Shop is open.");
}

// ---------------------------------------------------------------- Slots

const otherSymbols: readonly string[] = config.slots.symbols.filter(
  (symbol) => symbol !== KISS && symbol !== SEVEN,
);

function randomSymbol(rng: Rng): string {
  return config.slots.symbols[pickIndex(rng, config.slots.symbols.length)];
}

function slotLine(rng: Rng, outcome: string): string[] {
  const other = () => otherSymbols[pickIndex(rng, otherSymbols.length)];
  switch (outcome) {
    case "seven-triple":
      return [SEVEN, SEVEN, SEVEN];
    case "kiss-triple":
      return [KISS, KISS, KISS];
    case "triple": {
      const symbol = other();
      return [symbol, symbol, symbol];
    }
    case "kiss-double": {
      const line = [KISS, KISS, KISS];
      line[pickIndex(rng, 3)] = other();
      return line;
    }
    case "kiss-single": {
      const line = [other(), other(), other()];
      line[pickIndex(rng, 3)] = KISS;
      return line;
    }
    default: {
      let line = [other(), other(), other()];
      while (line[0] === line[1] && line[1] === line[2])
        line = [other(), other(), other()];
      return line;
    }
  }
}

export function spinSlots(
  previous: CasinoState,
  bet: number,
  rng: Rng,
  now: Date,
): StepResult {
  if (!(config.slots.bets as readonly number[]).includes(bet))
    throw new CasinoRuleError("That bet is not on the menu.");
  const { state, ledger, grants } = begin(previous, rng, now);
  requireBalance(state, bet);

  let roll = rng(RESOLUTION) / RESOLUTION;
  let outcome: (typeof config.slots.outcomes)[number] | null = null;
  for (const candidate of config.slots.outcomes) {
    roll -= candidate.probability;
    if (roll < 0) {
      outcome = candidate;
      break;
    }
  }
  const outcomeId = outcome?.id ?? "lose";
  const line = slotLine(rng, outcomeId);
  const reels = line.map((centre) => [
    randomSymbol(rng),
    centre,
    randomSymbol(rng),
  ]);
  let nearMissReel: SlotEvent["nearMissReel"] = null;
  if (!outcome && chance(rng, config.slots.nearMissRate)) {
    reels[0][1] = SEVEN;
    reels[1][1] = SEVEN;
    const position = chance(rng, 0.5) ? "above" : "below";
    reels[2][position === "above" ? 0 : 2] = SEVEN;
    nearMissReel = { reel: 2, position };
  }

  const play = settlePlay(
    state,
    {
      bet,
      basePayout: outcome ? Math.floor(bet * outcome.multiplier) : 0,
      bigWin: outcome?.bigWin ?? false,
      nearMiss: nearMissReel !== null,
      couponMultiplier: 1,
      metric: "slotSpins",
    },
    rng,
    now,
    grants,
  );
  state.stats.slotSpins += 1;
  play.beat = advanceBeat(state, play.payout > 0, rng, now, grants, play);

  return {
    state,
    ledger,
    grants,
    event: {
      kind: "slots",
      ...play,
      reels,
      outcome: outcomeId,
      nearMissReel,
    },
  };
}

function advanceBeat(
  state: CasinoState,
  herWin: boolean,
  rng: Rng,
  now: Date,
  grants: CouponGrant[],
  play: PlayEvent,
): CasinoVisit["beat"] | null {
  const beat = state.visit?.beat;
  if (!beat || beat.status !== "open") return null;
  const rules = config.beatGianmaria;
  beat.spins += 1;
  if (herWin) beat.herWins += 1;
  // Gianmaria is always exactly one win from victory — and never takes it
  // until her spins run out.
  beat.hisWins = Math.min(
    rules.targetWins - 1,
    Math.max(beat.hisWins + (chance(rng, 0.6) ? 1 : 0), beat.herWins),
  );
  if (beat.herWins >= rules.targetWins) {
    beat.status = "won";
    const tier = pickTierByWeights(rng, rules.prizeTiers);
    play.coupons.push(...grantTier(state, tier, "beat", rng, now, grants));
    state.dryPlays = 0;
  } else if (beat.spins >= rules.spins) {
    beat.hisWins = rules.targetWins;
    beat.status = "lost";
  }
  return { ...beat };
}

// ---------------------------------------------------------------- Scratch

export function scratchCard(
  previous: CasinoState,
  tier: ScratchTier,
  rng: Rng,
  now: Date,
): StepResult {
  const card = config.scratch.tiers[tier];
  if (!card) throw new CasinoRuleError("Unknown scratch card.");
  const { state, ledger, grants } = begin(previous, rng, now);
  requireBalance(state, card.cost);

  let roll = rng(RESOLUTION) / RESOLUTION;
  let winner: (typeof card.outcomes)[number] | null = null;
  for (const outcome of card.outcomes) {
    roll -= outcome.probability;
    if (roll < 0) {
      winner = outcome;
      break;
    }
  }
  const symbols = [
    ...card.outcomes.map((outcome) => outcome.symbol),
    ...config.scratch.fillerSymbols,
  ];
  const cells: string[] = [];
  const counts = new Map<string, number>();
  const place = (symbol: string) => {
    cells.push(symbol);
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  };
  let almostIndex: number | null = null;
  const nearMiss = !winner && chance(rng, config.scratch.nearMissRate);
  if (winner) for (let i = 0; i < 3; i++) place(winner.symbol);
  if (nearMiss) {
    place(SEVEN);
    place(SEVEN);
  }
  while (cells.length < (nearMiss ? 8 : 9)) {
    const candidates = symbols.filter(
      (symbol) => symbol !== winner?.symbol && (counts.get(symbol) ?? 0) < 2,
    );
    place(candidates[pickIndex(rng, candidates.length)]);
  }
  // Shuffle, then add the "almost" third jackpot symbol in a random cell.
  for (let index = cells.length - 1; index > 0; index--) {
    const other = pickIndex(rng, index + 1);
    [cells[index], cells[other]] = [cells[other], cells[index]];
  }
  if (nearMiss) {
    almostIndex = pickIndex(rng, 9);
    cells.splice(almostIndex, 0, SEVEN);
  }

  const play = settlePlay(
    state,
    {
      bet: card.cost,
      basePayout: winner ? Math.floor(card.cost * winner.multiplier) : 0,
      bigWin: winner?.symbol === SEVEN,
      nearMiss,
      couponMultiplier: card.couponMultiplier,
      metric: "scratches",
    },
    rng,
    now,
    grants,
  );
  state.stats.scratches += 1;
  return {
    state,
    ledger,
    grants,
    event: {
      kind: "scratch",
      ...play,
      tier,
      cells,
      winningSymbol: winner?.symbol ?? null,
      almostIndex,
    },
  };
}

// ---------------------------------------------------------------- Wheel

export function isFreeWheelAvailable(state: CasinoState, now: Date): boolean {
  return (
    !state.lastFreeWheelAt ||
    now.getTime() - new Date(state.lastFreeWheelAt).getTime() >=
      config.wheel.freeEveryHours * HOUR_MS
  );
}

export function spinWheel(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  const free = isFreeWheelAvailable(state, now);
  const cost = free ? 0 : config.wheel.cost;
  requireBalance(state, cost);
  if (free) state.lastFreeWheelAt = now.toISOString();

  const segments = config.wheel.segments;
  const segment = segments.indexOf(
    pickWeighted(rng, segments, (item) => item.weight),
  );
  const chosen = segments[segment];
  const jackpot = segments.reduce(
    (best, item, index) => (item.amount > segments[best].amount ? index : best),
    0,
  );
  const before = (jackpot - 1 + segments.length) % segments.length;
  const after = (jackpot + 1) % segments.length;
  const nearMiss = segment === before || segment === after;
  // Near the jackpot edge for neighbours; anywhere comfortable otherwise.
  const offset = nearMiss
    ? segment === before
      ? 0.9 + rng(80) / 1000
      : 0.02 + rng(80) / 1000
    : 0.2 + rng(600) / 1000;

  const play = settlePlay(
    state,
    {
      bet: cost,
      basePayout: chosen.kind === "kisses" ? chosen.amount : 0,
      bigWin: segment === jackpot,
      nearMiss,
      couponMultiplier: 1,
      forcedTiers:
        chosen.kind === "ticket" ? config.wheel.ticketTiers : undefined,
      metric: "wheelSpins",
    },
    rng,
    now,
    grants,
  );
  state.stats.wheelSpins += 1;
  return {
    state,
    ledger,
    grants,
    event: { kind: "wheel", ...play, free, segment, offset },
  };
}

// ---------------------------------------------------------------- Double

export function doubleOrNothing(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  const pending = state.pendingDouble;
  if (!pending || pending.amount <= 0)
    throw new CasinoRuleError("There is nothing to double right now.");
  requireBalance(state, pending.amount);
  const won = chance(rng, config.doubleOrNothing.winChance);
  state.stats.doubles += 1;
  if (state.visit) state.visit.metrics.doubles += 1;
  if (won) {
    state.balance += pending.amount;
    state.stats.kissesWon += pending.amount;
    state.pendingDouble = { amount: pending.amount * 2 };
  } else {
    state.balance -= pending.amount;
    state.pendingDouble = null;
  }
  return {
    state,
    ledger,
    grants,
    event: { kind: "double", won, amount: pending.amount },
  };
}

export function declineDouble(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  state.pendingDouble = null;
  return { state, ledger, grants, event: { kind: "enter" } };
}

// ---------------------------------------------------------------- Shop & debt

export function buyPack(
  previous: CasinoState,
  packId: string,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  let pack: { label: string; chips: number; realKisses: number } | undefined =
    config.shop.packs.find((item) => item.id === packId);
  if (!pack) {
    const deal = state.visit?.flashDeal;
    const definition = config.shop.flashDeals.find(
      (item) => item.id === packId,
    );
    if (
      !deal ||
      !definition ||
      deal.id !== packId ||
      deal.used ||
      new Date(deal.expiresAt).getTime() <= now.getTime()
    )
      throw new CasinoRuleError("That flash deal has already gone.");
    deal.used = true;
    pack = definition;
  }
  const doubled = !state.firstPurchaseUsed;
  const chips =
    pack.chips * (doubled ? config.shop.firstPurchaseMultiplier : 1);
  state.firstPurchaseUsed = true;
  state.balance += chips;
  state.debt += pack.realKisses;
  state.stats.packsBought += 1;
  state.stats.realKissesBought += pack.realKisses;
  ledger.push({
    kind: "purchase",
    realKisses: pack.realKisses,
    chips,
    label: doubled ? `${pack.label} (first purchase, doubled)` : pack.label,
    at: now.toISOString(),
  });
  return {
    state,
    ledger,
    grants,
    event: { kind: "purchase", chips, realKisses: pack.realKisses, doubled },
  };
}

export function breakPiggy(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  if (state.piggy <= 0) throw new CasinoRuleError("The piggy bank is empty.");
  const chips = state.piggy;
  const cost = config.piggy.breakCostRealKisses;
  state.balance += chips;
  state.piggy = 0;
  state.debt += cost;
  state.stats.piggyBreaks += 1;
  state.stats.realKissesBought += cost;
  ledger.push({
    kind: "piggy",
    realKisses: cost,
    chips,
    label: "Piggy bank broken",
    at: now.toISOString(),
  });
  return {
    state,
    ledger,
    grants,
    event: { kind: "piggy", chips, realKisses: cost },
  };
}

export function claimWelcome(
  previous: CasinoState,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  const visit = state.visit;
  if (!visit || visit.welcomeClaimed || visit.welcomeBonus <= 0)
    throw new CasinoRuleError("The welcome bonus has already been collected.");
  visit.welcomeClaimed = true;
  state.balance += visit.welcomeBonus;
  return {
    state,
    ledger,
    grants,
    event: { kind: "claim", chips: visit.welcomeBonus, label: "Welcome bonus" },
  };
}

export function missionProgress(visit: CasinoVisit, id: MissionId) {
  const definition = config.missions.pool.find((mission) => mission.id === id);
  if (!definition) return null;
  const value = Math.min(definition.target, visit.metrics[definition.metric]);
  return { definition, value, complete: value >= definition.target };
}

export function claimMission(
  previous: CasinoState,
  id: string,
  rng: Rng,
  now: Date,
): StepResult {
  const { state, ledger, grants } = begin(previous, rng, now);
  const mission = state.visit?.missions.find((item) => item.id === id);
  const progress =
    state.visit && mission ? missionProgress(state.visit, mission.id) : null;
  if (!mission || !progress?.complete || mission.claimed)
    throw new CasinoRuleError("That mission is not finished yet.");
  mission.claimed = true;
  state.balance += progress.definition.reward;
  return {
    state,
    ledger,
    grants,
    event: {
      kind: "claim",
      chips: progress.definition.reward,
      label: progress.definition.label,
    },
  };
}

export function payDebt(
  previous: CasinoState,
  realKisses: number,
  now: Date,
): StepResult {
  const state = clone(previous);
  if (!Number.isInteger(realKisses) || realKisses < 1)
    throw new CasinoRuleError("Enter how many kisses were paid.");
  const paid = Math.min(realKisses, state.debt);
  if (paid <= 0)
    throw new CasinoRuleError("There is no debt to pay. Suspicious.");
  state.debt -= paid;
  state.stats.realKissesPaid += paid;
  return {
    state,
    grants: [],
    ledger: [
      {
        kind: "payment",
        realKisses: -paid,
        chips: 0,
        label: paid === 1 ? "1 kiss paid" : `${paid} kisses paid`,
        at: now.toISOString(),
      },
    ],
    event: { kind: "payment", realKisses: paid },
  };
}

export function claimFinale(previous: CasinoState, now: Date): StepResult {
  const state = clone(previous);
  if (!state.curtain.unlocked || state.curtain.finaleClaimed)
    throw new CasinoRuleError("This coupon is not available.");
  const prize = getCasinoPrize("house-always-loses");
  if (!prize) throw new CasinoRuleError("Finale prize missing.");
  const grants: CouponGrant[] = [];
  const ledger: LedgerEntry[] = [];
  const forgiven = state.debt;
  if (forgiven > 0)
    ledger.push({
      kind: "forgiven",
      realKisses: -forgiven,
      chips: 0,
      label: "The House Always Loses to You",
      at: now.toISOString(),
    });
  state.debt = 0;
  state.curtain.finaleClaimed = true;
  const coupons = grantPrize(state, prize, "finale", now, grants);
  return {
    state,
    grants,
    ledger,
    event: { kind: "finale", coupons, forgiven },
  };
}

// ---------------------------------------------------------------- View

export interface CasinoView {
  balance: number;
  piggy: number;
  vip: {
    level: number;
    label: string;
    id: string;
    nextLabel: string | null;
    progress: number;
  };
  luckMeter: number;
  hot: { active: boolean; playsLeft: number; streak: number };
  pendingDouble: number | null;
  freeWheel: boolean;
  firstPurchaseDouble: boolean;
  curtainUnlocked: boolean;
  finaleClaimed: boolean;
  recentWins: { text: string; at: string }[];
  visit: {
    welcomeBonus: number;
    daysAway: number | null;
    luckBoost: boolean;
    missions: {
      id: string;
      label: string;
      reward: number;
      progress: number;
      value: number;
      target: number;
      complete: boolean;
      claimed: boolean;
    }[];
    flashDeal: {
      id: string;
      label: string;
      chips: number;
      realKisses: number;
      expiresAt: string;
    } | null;
    beat: CasinoVisit["beat"] & { target: number; maxSpins: number };
  } | null;
  sets: {
    id: string;
    label: string;
    owned: number;
    total: number;
    progress: number;
    complete: boolean;
  }[];
}

/** Progress bars start partly filled so every goal looks nearly done. */
export function giftedProgress(value: number, target: number): number {
  const head = config.missions.giftedProgress;
  if (target <= 0) return 1;
  return Math.min(1, head + (1 - head) * (value / target));
}

export function luckMeterFor(dryPlays: number): number {
  const { floor, ceiling } = config.luckMeter;
  return (
    floor +
    (ceiling - floor) * Math.min(1, dryPlays / config.pity.guaranteeAfter)
  );
}

export function toView(state: CasinoState, now: Date): CasinoView {
  const levels = config.vipLevels;
  const current = levels[state.vipLevel];
  const next = levels[state.vipLevel + 1] ?? null;
  const visit = state.visit;
  const deal = visit?.flashDeal;
  const dealDefinition = deal
    ? config.shop.flashDeals.find((item) => item.id === deal.id)
    : undefined;
  return {
    balance: state.balance,
    piggy: state.piggy,
    vip: {
      level: state.vipLevel,
      label: current.label,
      id: current.id,
      nextLabel: next?.label ?? null,
      progress: next
        ? giftedProgress(
            state.stats.wagered - current.threshold,
            next.threshold - current.threshold,
          )
        : 1,
    },
    luckMeter: luckMeterFor(state.dryPlays),
    hot: {
      active: state.hot.boosted > 0,
      playsLeft: state.hot.boosted,
      streak: state.hot.streak,
    },
    pendingDouble: state.pendingDouble?.amount ?? null,
    freeWheel: isFreeWheelAvailable(state, now),
    firstPurchaseDouble: !state.firstPurchaseUsed,
    curtainUnlocked: state.curtain.unlocked,
    finaleClaimed: state.curtain.finaleClaimed,
    recentWins: state.recentWins,
    visit: visit
      ? {
          welcomeBonus: visit.welcomeClaimed ? 0 : visit.welcomeBonus,
          daysAway: visit.daysAway,
          luckBoost: visit.boostPlaysLeft > 0,
          missions: visit.missions.flatMap((mission) => {
            const progress = missionProgress(visit, mission.id);
            if (!progress) return [];
            return [
              {
                id: mission.id,
                label: progress.definition.label,
                reward: progress.definition.reward,
                value: progress.value,
                target: progress.definition.target,
                progress: giftedProgress(
                  progress.value,
                  progress.definition.target,
                ),
                complete: progress.complete,
                claimed: mission.claimed,
              },
            ];
          }),
          flashDeal:
            deal &&
            dealDefinition &&
            !deal.used &&
            new Date(deal.expiresAt).getTime() > now.getTime()
              ? {
                  id: deal.id,
                  label: dealDefinition.label,
                  chips: dealDefinition.chips,
                  realKisses: dealDefinition.realKisses,
                  expiresAt: deal.expiresAt,
                }
              : null,
          beat: {
            ...visit.beat,
            target: config.beatGianmaria.targetWins,
            maxSpins: config.beatGianmaria.spins,
          },
        }
      : null,
    sets: casinoSets.map((set) => {
      const pieces = casinoPrizes.filter((prize) => prize.setId === set.id);
      const owned = pieces.filter((piece) =>
        state.collected.includes(piece.id),
      ).length;
      return {
        id: set.id,
        label: set.label,
        owned,
        total: pieces.length,
        progress: giftedProgress(owned, pieces.length),
        complete: state.completedSets.includes(set.id),
      };
    }),
  };
}

/** Something waiting to be collected: drives the red badge in the menu. */
export function hasPendingRewards(
  state: CasinoState | null,
  now: Date,
): boolean {
  if (!state) return true;
  const visitStale = isVisitStale(state, now);
  const daysAway = state.lastActivityAt
    ? (now.getTime() - new Date(state.lastActivityAt).getTime()) / DAY_MS
    : null;
  const welcomeWaiting = visitStale
    ? welcomeBonusFor(daysAway) > 0
    : Boolean(
        state.visit &&
        !state.visit.welcomeClaimed &&
        state.visit.welcomeBonus > 0,
      );
  return (
    welcomeWaiting ||
    isFreeWheelAvailable(state, now) ||
    !state.firstPurchaseUsed
  );
}
