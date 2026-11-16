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
   * Love Slots. Outcomes are drawn first, then reels are drawn to match.
   * `multiplier` × bet is paid; anything under 1 is a loss disguised as a win
   * (lights, sound and "WIN!" anyway). `bigWin` triggers the full-screen show.
   */
  slots: {
    bets: [5, 10, 25],
    symbols: ["💋", "❤️", "🍝", "🍦", "✈️", "🎬", "💆", "🌹", "7️⃣"],
    outcomes: [
      { id: "seven-triple", probability: 0.004, multiplier: 50, bigWin: true },
      { id: "kiss-triple", probability: 0.01, multiplier: 20, bigWin: true },
      { id: "triple", probability: 0.03, multiplier: 5, bigWin: false },
      { id: "kiss-double", probability: 0.07, multiplier: 2, bigWin: false },
      // Loss disguised as a win: pays half the bet with full celebration.
      { id: "kiss-single", probability: 0.16, multiplier: 0.5, bigWin: false },
    ],
    /** Near misses — share of losing spins that show two 7️⃣/💋 and a third just off the line. */
    nearMissRate: 0.38,
    /** Animation lengths (ms). A normal spin never exceeds 2 seconds. */
    spinMs: 1800,
    turboSpinMs: 650,
    autoSpinCounts: [10, 25],
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

  /** Hot Streak — `winsNeeded` winning plays in a row double payouts for the next `plays` plays. */
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
