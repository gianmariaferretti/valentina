import type { PrizeTier } from "./casino-config.ts";
import type {
  CouponCategory,
  CouponRarity,
  CouponSetting,
} from "@/features/coupons/types";

/**
 * Kiss Casino prize pool. Every win becomes its own coupon instance
 * (`casino-c001`, code `GV-C001`) built from one of these templates. This pool
 * is separate from the fixed catalogue.
 */

export type PrizeKind = PrizeTier | "set-bonus" | "finale";

export interface CasinoPrize {
  readonly id: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly kind: PrizeKind;
  readonly setting: CouponSetting;
  readonly category: CouponCategory;
  /** Relative weight inside its tier. Set keystones are deliberately scarce. */
  readonly weight: number;
  readonly setId?: CasinoSetId;
}

export const casinoSets = [
  {
    id: "distance-survival-kit",
    label: "Distance Survival Kit",
    bonusPrizeId: "care-package",
  },
  {
    id: "spa-collection",
    label: "Spa Collection",
    bonusPrizeId: "full-spa-evening",
  },
  {
    id: "food-lover",
    label: "Food Lover",
    bonusPrizeId: "tasting-menu-at-home",
  },
] as const;

export type CasinoSetId = (typeof casinoSets)[number]["id"];

/** Weight given to the last piece of every set. Ordinary pieces weigh 1. */
const KEYSTONE = 0.2;

export const casinoPrizes: readonly CasinoPrize[] = [
  // Common
  {
    id: "back-scratch",
    title: "10 Minute Back Scratch",
    shortDescription: "Ten minutes of professional-grade back scratching.",
    description:
      "Ten full minutes of back scratching, with directions accepted in real time (“left… no, MY left”).",
    kind: "common",
    setting: "together",
    category: "romantic",
    weight: 1,
    setId: "spa-collection",
  },
  {
    id: "foot-rub",
    title: "5 Minute Foot Rub",
    shortDescription: "Five minutes. Feet. No complaints about the feet.",
    description:
      "A five-minute foot rub, delivered without commentary, faces or questions about where those feet have been.",
    kind: "common",
    setting: "together",
    category: "romantic",
    weight: 1,
    setId: "spa-collection",
  },
  {
    id: "emergency-ice-cream",
    title: "Emergency Ice Cream",
    shortDescription: "Ice cream, deployed on request. No questions asked.",
    description:
      "One emergency ice cream, sourced and delivered on request. Flavour choice is non-negotiable and entirely yours.",
    kind: "common",
    setting: "together",
    category: "food",
    weight: 1,
    setId: "food-lover",
  },
  {
    id: "hot-chocolate",
    title: "Hot Chocolate to the Sofa",
    shortDescription: "Hot chocolate, carried all the way to the sofa.",
    description:
      "A hot chocolate made and carried to wherever you are sitting, with a blanket if requested.",
    kind: "common",
    setting: "together",
    category: "food",
    weight: 1,
    setId: "food-lover",
  },
  {
    id: "video-call-your-rules",
    title: "Video Call, Your Rules",
    shortDescription: "A call with no time limit. Only you can hang up.",
    description:
      "A video call with no time limit. Only you decide when it ends; Gianmaria's battery is his own problem.",
    kind: "common",
    setting: "apart",
    category: "romantic",
    weight: 1,
    setId: "distance-survival-kit",
  },
  {
    id: "voice-note-serenade",
    title: "Voice Note Serenade",
    shortDescription: "A sung voice note. Talent not included.",
    description:
      "A voice note in which Gianmaria sings a song of your choice. Musical ability is neither promised nor present.",
    kind: "common",
    setting: "apart",
    category: "romantic",
    weight: 1,
    setId: "distance-survival-kit",
  },
  {
    id: "choose-tonights-episode",
    title: "Choose Tonight's Episode",
    shortDescription: "You pick the episode. Gianmaria pretends he wanted it.",
    description:
      "Tonight's episode is your choice, watched together on a call. Gianmaria will act thrilled.",
    kind: "common",
    setting: "apart",
    category: "dates",
    weight: 1,
  },
  {
    id: "three-compliments",
    title: "3 Compliments on Demand",
    shortDescription: "Three sincere compliments, delivered instantly.",
    description:
      "Three specific, sincere compliments, delivered on demand at any hour. Generic ones are refunded.",
    kind: "common",
    setting: "apart",
    category: "romantic",
    weight: 1,
  },
  // Rare
  {
    id: "massage-30",
    title: "30 Minute Massage",
    shortDescription: "Thirty minutes of amateur but committed massage.",
    description:
      "Thirty uninterrupted minutes of amateur but committed massage. Phones away.",
    kind: "rare",
    setting: "together",
    category: "romantic",
    weight: 1,
    setId: "spa-collection",
  },
  {
    id: "breakfast-in-bed",
    title: "Breakfast in Bed",
    shortDescription: "Breakfast, delivered to bed. No commuting required.",
    description:
      "Breakfast, delivered directly to bed. Crumbs are his problem.",
    kind: "rare",
    setting: "together",
    category: "food",
    weight: 1,
    setId: "food-lover",
  },
  {
    id: "saturday-movie-night",
    title: "Saturday Movie Night",
    shortDescription: "A synchronised film night. You choose the film.",
    description:
      "One film, two screens, a synchronised “3, 2, 1, play”. You choose the film.",
    kind: "rare",
    setting: "apart",
    category: "dates",
    weight: 1,
  },
  {
    id: "same-recipe-two-kitchens",
    title: "Same Recipe, Two Kitchens",
    shortDescription: "The same dish, cooked together on a video call.",
    description:
      "We cook the same recipe at the same time in two kitchens, then compare with brutal honesty.",
    kind: "rare",
    setting: "apart",
    category: "food",
    weight: 1,
  },
  {
    id: "delivery-surprise",
    title: "Delivery Surprise",
    shortDescription: "Dinner or dessert delivered to your door.",
    description:
      "A surprise dinner or dessert delivered to your door. Gianmaria chooses and waits nervously for the verdict.",
    kind: "rare",
    setting: "apart",
    category: "food",
    weight: 1,
    setId: "distance-survival-kit",
  },
  // Epic
  {
    id: "online-date-night",
    title: "Online Date Night",
    shortDescription:
      "A remote dinner organised by Gianmaria: menu, time and dress code.",
    description:
      "A date night at a distance, organised by Gianmaria: he sets the menu, the time and the dress code, and each of us sits at our own table.",
    kind: "epic",
    setting: "apart",
    category: "dates",
    weight: 1,
  },
  {
    id: "flowers-at-your-door",
    title: "Flowers at Your Door",
    shortDescription: "Surprise flowers delivered to your home.",
    description: "Flowers delivered to your door, for no reason at all.",
    kind: "epic",
    setting: "apart",
    category: "romantic",
    weight: 1,
  },
  {
    id: "handwritten-letter",
    title: "Handwritten Letter",
    shortDescription: "A real paper letter, sent by real post.",
    description:
      "A handwritten letter on real paper, sent by post. The final piece of the Distance Survival Kit — and the hardest to find.",
    kind: "epic",
    setting: "apart",
    category: "romantic",
    weight: KEYSTONE,
    setId: "distance-survival-kit",
  },
  {
    id: "massage-60",
    title: "1 Hour Massage",
    shortDescription: "A full hour. The legendary edition.",
    description:
      "A full one-hour massage. The final piece of the Spa Collection — and, naturally, the rarest.",
    kind: "epic",
    setting: "together",
    category: "romantic",
    weight: KEYSTONE,
    setId: "spa-collection",
  },
  {
    id: "dinner-cooked-by-gianmaria",
    title: "Dinner Cooked by Gianmaria",
    shortDescription: "A full dinner planned and cooked by Gianmaria.",
    description:
      "A full dinner, planned and cooked by Gianmaria. The final piece of the Food Lover set — and the one the house hides best.",
    kind: "epic",
    setting: "together",
    category: "food",
    weight: KEYSTONE,
    setId: "food-lover",
  },
  // Jackpot
  {
    id: "weekend-getaway",
    title: "Weekend Getaway",
    shortDescription: "A weekend somewhere else. The house is crying.",
    description:
      "A weekend away, destination agreed together. The house did not think this would happen.",
    kind: "jackpot",
    setting: "together",
    category: "dates",
    weight: 1,
  },
  {
    id: "im-coming-to-you",
    title: "I'm Coming to You",
    shortDescription: "Gianmaria gets on a plane and comes to you.",
    description:
      "Gianmaria takes a plane and comes to you. Dates agreed together; the airport hug is mandatory.",
    kind: "jackpot",
    setting: "apart",
    category: "dates",
    weight: 1,
  },
  {
    id: "whatever-you-want-day",
    title: "Whatever You Want Day",
    shortDescription: "A whole day. Your rules. No appeals.",
    description:
      "A full day where you decide everything. Gianmaria's appeals tribunal is closed for the day.",
    kind: "jackpot",
    setting: "together",
    category: "romantic",
    weight: 1,
  },
  // Set bonuses
  {
    id: "care-package",
    title: "Care Package",
    shortDescription: "A box of small comforts, posted to you.",
    description:
      "Bonus for completing the Distance Survival Kit: a box of small comforts, packed and posted by Gianmaria.",
    kind: "set-bonus",
    setting: "apart",
    category: "romantic",
    weight: 0,
  },
  {
    id: "full-spa-evening",
    title: "Full Spa Evening",
    shortDescription: "Candles, masks, massage. The complete spa.",
    description:
      "Bonus for completing the Spa Collection: a full spa evening, candles and face masks included.",
    kind: "set-bonus",
    setting: "together",
    category: "romantic",
    weight: 0,
  },
  {
    id: "tasting-menu-at-home",
    title: "Tasting Menu at Home",
    shortDescription: "Five tiny courses. One very serious waiter.",
    description:
      "Bonus for completing the Food Lover set: a five-course tasting menu at home, served by a waiter who takes himself far too seriously.",
    kind: "set-bonus",
    setting: "together",
    category: "food",
    weight: 0,
  },
  // Finale
  {
    id: "house-always-loses",
    title: "The House Always Loses to You",
    shortDescription: "Your kiss debt, forgiven in full.",
    description:
      "Found behind the curtain. Your entire kiss debt is forgiven. The house was always going to lose to you.",
    kind: "finale",
    setting: "together",
    category: "romantic",
    weight: 0,
  },
];

export const prizeRarity: Record<PrizeKind, CouponRarity> = {
  common: "standard",
  rare: "premium",
  epic: "legendary",
  jackpot: "impossible",
  "set-bonus": "legendary",
  finale: "impossible",
};

export function getCasinoPrize(id: string): CasinoPrize | undefined {
  return casinoPrizes.find((prize) => prize.id === id);
}
