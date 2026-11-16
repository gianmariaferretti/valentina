/**
 * Kiss Casino — every tunable mechanism in one place.
 *
 * The casino is deliberately, openly rigged in Gianmaria's favour. Each block
 * says which mechanism it is and what it is for, so the numbers can be tuned
 * without touching the engine. All draws happen on the server.
 *
 * Probabilities are per play unless stated otherwise. A "play" is one slot
 * spin, one scratch card or one wheel spin. Tuned for short, occasional
 * visits of roughly 30 plays: a common coupon most visits, a rare one now and
 * then, an epic one rarely.
 */

export type PrizeTier = "common" | "rare" | "epic" | "jackpot";

export const prizeTiers = ["common", "rare", "epic", "jackpot"] as const;

export const casinoConfig = {
  /** Starting balance for a brand-new player: a taste, not a whole visit. */
  startingBalance: 50,

  /**
   * Visit boundary. Activity after this many quiet minutes starts a new visit:
   * fresh missions, a new flash deal, a new Beat Gianmaria challenge.
   */
  visitGapMinutes: 30,

  /**
   * Welcome back — absence is rewarded, never punished. The bonus grows from
   * `minBonus` after `minDays` to `maxBonus` after `maxDays`; the first
   * `boostPlays` of that visit also get better coupon odds ("Your luck is hot").
   * A brand-new player receives `firstVisitBonus`.
   */
  welcomeBack: {
    firstVisitBonus: 10,
    minDays: 1,
    minBonus: 10,
    maxDays: 14,
    maxBonus: 100,
    boostPlays: 5,
    boostMultiplier: 1.5,
  },

  /**
   * Variable reinforcement — base coupon odds for each play. Small kiss
   * payouts are frequent; coupons are the occasional big reward.
   */
  couponOdds: {
    common: 0.05,
    rare: 0.02,
    epic: 0.006,
    jackpot: 0.001,
  } satisfies Record<PrizeTier, number>,

  /**
   * Beginner's luck — the first `plays` lifetime plays multiply coupon odds,
   * and if no rare (or better) coupon has dropped by the last of them, one is
   * forced. Afterwards odds silently fall back to normal.
   */
  beginnersLuck: {
    plays: 15,
    multiplier: 4,
  },

  /**
   * Pity timer — every play without a coupon raises the odds. From
   * `rampStart` dry plays the odds grow by `rampPerPlay` (×base) each play,
   * and a coupon is guaranteed on dry play number `guaranteeAfter`. The
   * counter survives between visits.
   */
  pity: {
    rampStart: 12,
    rampPerPlay: 0.3,
    guaranteeAfter: 40,
  },

  /**
   * Luck meter — shows pity progress without the real number, mapped into a
   * range that always looks "nearly full".
   */
  luckMeter: { floor: 0.55, ceiling: 0.97 },

  /**
   * Love Slots — five reels, three rows, three paylines (top, middle,
   * bottom). Outcomes are drawn first, then reels are drawn to match.
   * `multiplier` × bet is paid on one line; anything under 1 is a loss
   * disguised as a win (lights, sound and "WIN!" anyway).
   * Coupons won on a spin appear as three of their tier's symbol on a line
   * (`couponSymbols`), so the paytable can show what each symbol is worth.
   */
  slots: {
    bets: [5, 10, 25],
    reels: 5,
    rows: 3,
    symbols: ["💋", "❤️", "🍝", "🍦", "✈️", "🎬", "💆", "🌹", "7️⃣"],
    outcomes: [
      { id: "kiss-5", label: "💋💋💋💋💋", probability: 0.002, multiplier: 40 },
      { id: "kiss-4", label: "💋💋💋💋", probability: 0.01, multiplier: 12 },
      { id: "kiss-3", label: "💋💋💋", probability: 0.03, multiplier: 5 },
      {
        id: "triple",
        label: "❤️❤️❤️ · 🍝🍝🍝 · 🎬🎬🎬 · ✈️✈️✈️",
        probability: 0.08,
        multiplier: 3,
      },
      // Loss disguised as a win: two kisses pay half the bet, with fanfare.
      { id: "kiss-pair", label: "💋💋", probability: 0.18, multiplier: 0.5 },
    ],
    /** Symbols shown for coupon wins, by tier. */
    couponSymbols: { common: "🍦", rare: "💆", epic: "🌹", jackpot: "7️⃣" },
    tripleSymbols: ["❤️", "🍝", "🎬", "✈️"],
    /** Near misses — share of losing spins that show 7️⃣7️⃣ and a third 7️⃣ just off the line. */
    nearMissRate: 0.38,
    /** Animation lengths (ms). Suspense is added to the last reels after two jackpot symbols. */
    spinMs: 1900,
    turboSpinMs: 750,
    suspenseMs: 900,
    autoSpinCounts: [10, 25],
  },

  /**
   * Roulette dei Baci — a single-zero wheel (0–36). Payouts are total
   * returns, stake included, set a little under fair odds. A straight bet
   * on 31 (the day it all began) that lands also wins an epic coupon.
   */
  roulette: {
    bets: [5, 10, 25],
    order: [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
    ],
    red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    payouts: { color: 1.8, parity: 1.8, number: 32 },
    jackpotNumber: 31,
    jackpotTiers: { common: 0, rare: 0, epic: 1, jackpot: 0 },
    spinMs: 2600,
  },

  /**
   * Blackjack dei Baci — one quick hand against the croupier: Hit or Stand,
   * dealer stands on 17. Payouts are total returns, stake included.
   * A natural blackjack also wins a rare coupon.
   */
  blackjack: {
    bets: [5, 10, 25],
    winPays: 2,
    pushPays: 1,
    naturalPays: 2,
    dealerStandsOn: 17,
    naturalTiers: { common: 0, rare: 1, epic: 0, jackpot: 0 },
  },

  /** Celebration levels by payout ÷ bet. A jackpot coupon is always JACKPOT. */
  celebrations: { bigWin: 10, megaWin: 25 },

  /**
   * Jackpot ticker — a display-only progressive number that creeps up with
   * every bet and resets when a jackpot coupon is won.
   */
  jackpotTicker: { base: 777, perBet: 0.15 },

  /**
   * Kiss Pass — a short season track: every `playsPerTier` plays unlocks the
   * next tier's kisses, to collect from the Rewards drawer.
   */
  kissPass: {
    playsPerTier: 6,
    rewards: [10, 10, 15, 15, 20, 20, 25, 30, 40, 60],
  },

  /**
   * Reset — redeeming a coupon won at the casino wipes the casino clean, as
   * if it had never been used: balance back to `startingBalance`; luck,
   * beginner's luck, missions, piggy bank, hot streak, VIP, sets, Kiss Pass,
   * offers (first purchase ×2 included) and Behind the Curtain reset; the
   * welcome tour returns. Coupons and redeemed stubs are never touched.
   * `resetDebtOnReset` archives the kiss debt as a closed season and starts
   * the next one at zero.
   */
  reset: {
    resetOnCasinoCouponRedeem: true,
    resetDebtOnReset: true,
  },

  /**
   * Scratch cards. Matching three symbols pays `multiplier` × cost. Losing
   * cards often show two jackpot symbols and an "almost" third.
   * `couponMultiplier` scales the coupon odds for pricier cards.
   */
  scratch: {
    nearMissRate: 0.45,
    tiers: {
      bronze: {
        label: "Bronze",
        cost: 10,
        couponMultiplier: 1,
        outcomes: [
          { symbol: "7️⃣", probability: 0.01, multiplier: 10 },
          { symbol: "💋", probability: 0.06, multiplier: 3 },
          { symbol: "❤️", probability: 0.1, multiplier: 1.5 },
          { symbol: "🌹", probability: 0.18, multiplier: 0.5 },
        ],
      },
      silver: {
        label: "Silver",
        cost: 25,
        couponMultiplier: 2,
        outcomes: [
          { symbol: "7️⃣", probability: 0.012, multiplier: 12 },
          { symbol: "💋", probability: 0.06, multiplier: 3 },
          { symbol: "❤️", probability: 0.1, multiplier: 1.5 },
          { symbol: "🌹", probability: 0.18, multiplier: 0.6 },
        ],
      },
      gold: {
        label: "Gold",
        cost: 60,
        couponMultiplier: 4,
        outcomes: [
          { symbol: "7️⃣", probability: 0.015, multiplier: 15 },
          { symbol: "💋", probability: 0.06, multiplier: 3 },
          { symbol: "❤️", probability: 0.1, multiplier: 1.5 },
          { symbol: "🌹", probability: 0.2, multiplier: 0.6 },
        ],
      },
    },
    fillerSymbols: ["🍝", "🍦", "✈️", "🎬", "💆"],
  },

  /**
   * Wheel of Fortune. One free spin per visit, at most every
   * `freeEveryHours`; otherwise it costs `cost`. Segments are listed in wheel
   * order. "ticket" draws a coupon (common or better). The jackpot segment
   * sits between two low-value neighbours, which land with a near-miss.
   */
  wheel: {
    cost: 20,
    freeEveryHours: 12,
    segments: [
      { label: "200 💋", kind: "kisses", amount: 200, weight: 0.5 },
      { label: "5 💋", kind: "kisses", amount: 5, weight: 16 },
      { label: "Ticket", kind: "ticket", amount: 0, weight: 4 },
      { label: "15 💋", kind: "kisses", amount: 15, weight: 12 },
      { label: "A hug", kind: "kisses", amount: 0, weight: 14 },
      { label: "25 💋", kind: "kisses", amount: 25, weight: 8 },
      { label: "10 💋", kind: "kisses", amount: 10, weight: 14 },
      { label: "50 💋", kind: "kisses", amount: 50, weight: 3 },
      { label: "A wink", kind: "kisses", amount: 0, weight: 12 },
      { label: "Ticket", kind: "ticket", amount: 0, weight: 3.5 },
      { label: "20 💋", kind: "kisses", amount: 20, weight: 10 },
      { label: "5 💋", kind: "kisses", amount: 5, weight: 16 },
    ],
    /** Coupon tier odds when landing on "Ticket". */
    ticketTiers: { common: 0.8, rare: 0.17, epic: 0.03, jackpot: 0 },
  },

  /**
   * Double or Nothing — after any kiss win. Slightly under 50/50, because
   * of course it is.
   */
  doubleOrNothing: { winChance: 0.45 },
  // Played as a coin toss: heads doubles the win, tails loses it.

  /** Hot Streak — `winsNeeded` winning plays in a row double payouts for the next `plays` plays. Slots, scratch cards and the wheel only. */
  hotStreak: { winsNeeded: 3, multiplier: 2, plays: 5 },

  /**
   * Visit missions — `perVisit` quick goals each visit, paid in kisses.
   * Progress bars start with `giftedProgress` already filled so every goal
   * looks nearly done.
   */
  missions: {
    perVisit: 3,
    giftedProgress: 0.15,
    pool: [
      {
        id: "spin-10",
        label: "Spin 10 times",
        metric: "slotSpins",
        target: 10,
        reward: 15,
      },
      {
        id: "scratch-2",
        label: "Scratch 2 tickets",
        metric: "scratches",
        target: 2,
        reward: 20,
      },
      {
        id: "win-coupon",
        label: "Win any coupon",
        metric: "coupons",
        target: 1,
        reward: 30,
      },
      {
        id: "wheel-1",
        label: "Spin the wheel",
        metric: "wheelSpins",
        target: 1,
        reward: 10,
      },
      {
        id: "double-1",
        label: "Dare to double once",
        metric: "doubles",
        target: 1,
        reward: 15,
      },
      {
        id: "wager-100",
        label: "Play 100 💋",
        metric: "wagered",
        target: 100,
        reward: 20,
      },
      {
        id: "tables-3",
        label: "Play 3 table games",
        metric: "tables",
        target: 3,
        reward: 15,
      },
    ],
  },

  /**
   * VIP levels — by lifetime kisses played; never lost. Each level unlocks a
   * slot theme and pays a one-off bonus. Diamond also opens Behind the Curtain.
   */
  vipLevels: [
    { id: "bronze", label: "Bronze", threshold: 0, bonus: 0 },
    { id: "silver", label: "Silver", threshold: 120, bonus: 20 },
    { id: "gold", label: "Gold", threshold: 350, bonus: 40 },
    { id: "diamond", label: "Diamond", threshold: 700, bonus: 80 },
    { id: "royale", label: "Valentina Royale", threshold: 1500, bonus: 150 },
  ],

  /**
   * Kiss Shop. `realKisses` is what each pack adds to the real-kiss debt.
   * The Smooch Bundle is the decoy that makes the French Treasury look clever.
   * The first purchase ever is doubled (`firstPurchaseMultiplier`).
   */
  shop: {
    packs: [
      {
        id: "peck-pack",
        label: "Peck Pack",
        chips: 10,
        realKisses: 5,
        badge: null,
      },
      {
        id: "smooch-bundle",
        label: "Smooch Bundle",
        chips: 60,
        realKisses: 25,
        badge: "MOST POPULAR",
      },
      {
        id: "french-treasury",
        label: "French Treasury",
        chips: 150,
        realKisses: 50,
        badge: "BEST VALUE +50%",
      },
      {
        id: "royal-vault",
        label: "Royal Vault",
        chips: 500,
        realKisses: 150,
        badge: null,
      },
    ],
    firstPurchaseMultiplier: 2,
    /** Flash deal — one per visit, expiring a few minutes after arrival. */
    flashDealMinutes: 5,
    flashDeals: [
      {
        id: "flash-smooch-plus",
        label: "Smooch Bundle + 30 bonus",
        chips: 90,
        realKisses: 25,
      },
      {
        id: "flash-double-peck",
        label: "Double Peck",
        chips: 25,
        realKisses: 8,
      },
      {
        id: "flash-treasury-lite",
        label: "Treasury Lite",
        chips: 110,
        realKisses: 35,
      },
    ],
  },

  /**
   * Piggy bank — fills itself by `share` of every bet (minimum 1 💋).
   * Breaking it costs `breakCostRealKisses` real kisses.
   */
  piggy: { share: 0.25, breakCostRealKisses: 30 },

  /** Kiss debt interest — above `threshold`, `rate` extra real kisses at most every `everyHours`. */
  debtInterest: { threshold: 100, rate: 0.1, everyHours: 24 },

  /**
   * Beat Gianmaria — each visit: win `targetWins` slot spins within `spins`
   * before simulated Gianmaria does. He always sits one win from victory.
   * Beating him draws a coupon with `prizeTiers` odds.
   */
  beatGianmaria: {
    targetWins: 3,
    spins: 10,
    prizeTiers: { common: 0.75, rare: 0.25, epic: 0, jackpot: 0 },
  },

  /** Social-style feed of other "players". Mixed with Valentina's real wins. */
  feed: [
    "Gianmaria won… a hug. Disappointing.",
    "Gianmaria won 5 💋 and called it a comeback.",
    "The house won. The house is Gianmaria.",
    "Someone in Bogotá hit 7️⃣7️⃣ and then a 🍝.",
    "Gianmaria bought a Royal Vault. For himself. Suspicious.",
    "A tourist won a Weekend Getaway. Allegedly.",
    "Gianmaria's luck meter: 3%. As expected.",
    "Nonna won Emergency Ice Cream and refused to share.",
  ],

  /** Behind the Curtain unlocks at this VIP level or on the first jackpot coupon. */
  curtain: { unlockVipLevel: "diamond" },
} as const;

export type CasinoConfig = typeof casinoConfig;
export type ScratchTier = keyof typeof casinoConfig.scratch.tiers;
export const scratchTiers = ["bronze", "silver", "gold"] as const;
export type MissionMetric =
  (typeof casinoConfig.missions.pool)[number]["metric"];
