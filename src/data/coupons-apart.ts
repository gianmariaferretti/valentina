import type {
  Coupon,
  CouponCategory,
  CouponRarity,
} from "@/features/coupons/types";

/** Long-distance coupons (`setting: "apart"`), codes GV-D01 onwards. */

const DEFAULT_TERMS = [
  "Valid once.",
  "Subject to Wi-Fi, time zones and common sense.",
] as const;

interface ApartDefinition {
  readonly id: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly category: CouponCategory;
  readonly rarity: CouponRarity;
  /** Number of identical tickets issued; each gets its own id and code. */
  readonly copies?: number;
  readonly terms?: readonly string[];
}

const definitions: readonly ApartDefinition[] = [
  // Standard
  {
    id: "saturday-movie-night",
    title: "Saturday Movie Night",
    shortDescription:
      "One film, two screens, a synchronised “3, 2, 1, play”. You choose.",
    description:
      "A Saturday night film across two sofas. We count down together — “3, 2, 1, play” — and press start at exactly the same moment. You choose the film. Gianmaria waives his right to propose something “short, I promise” that is three hours long.",
    category: "dates",
    rarity: "standard",
    copies: 3,
    terms: [
      "Valid once per ticket.",
      "Valentina chooses the film. Gianmaria's opinion is noted and filed.",
      "Pausing for snacks requires a formal announcement.",
    ],
  },
  {
    id: "video-call-your-rules",
    title: "Video Call, Your Rules",
    shortDescription: "A call with no time limit. Only you can hang up.",
    description:
      "A video call with no time limit, no “I should really sleep” and no surprise yawning used as a negotiation tactic. The call ends when you say it ends. Gianmaria's battery is his own responsibility.",
    category: "romantic",
    rarity: "standard",
    copies: 2,
    terms: [
      "Valid once per ticket.",
      "Only Valentina may end the call. Dropped connections must be redialled immediately.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  {
    id: "same-recipe-two-kitchens",
    title: "Same Recipe, Two Kitchens",
    shortDescription:
      "We cook the same dish on a video call. Results will differ.",
    description:
      "Same recipe, same time, two kitchens and one video call. We cook side by side at a distance, then compare results with great honesty and minimal diplomacy. Smoke alarms count as live commentary.",
    category: "food",
    rarity: "standard",
    copies: 2,
    terms: [
      "Valid once per ticket.",
      "The recipe is chosen together. Ingredients are each cook's own problem.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  {
    id: "legendary-binge",
    title: "Legen… wait for it… dary Binge",
    shortDescription:
      "Unlimited How I Met Your Mother on a call. Nobody says “last one”.",
    description:
      "An unlimited number of How I Met Your Mother episodes on a video call. The phrase “last episode” is banned for the entire session; using it is a breach of the Bro Code and the girlfriend code simultaneously. Suit up, or at least wear socks.",
    category: "dates",
    rarity: "standard",
    terms: [
      "Valid once.",
      "No episode limit. Whoever says “last episode” must watch two more.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  {
    id: "playlist-made-for-you",
    title: "Playlist Made for You",
    shortDescription: "A made-to-measure playlist with a note for every song.",
    description:
      "A playlist built only for you, with a small handwritten-in-spirit note explaining every song: why it is there, what it reminds Gianmaria of, and which one you are allowed to skip without consequences.",
    category: "romantic",
    rarity: "standard",
    terms: [
      "Valid once.",
      "Every song comes with a note. Skipping one is permitted exactly once.",
    ],
  },
  {
    id: "fall-asleep-on-video-call",
    title: "Fall Asleep on Video Call",
    shortDescription: "We fall asleep on a call. Whoever hangs up first loses.",
    description:
      "We fall asleep on a video call, like two people who definitely have work tomorrow. Whoever hangs up first loses and owes the other one good-morning message of at least three sentences.",
    category: "romantic",
    rarity: "standard",
    terms: [
      "Valid once.",
      "Snoring will not be recorded or used as evidence.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  // Premium
  {
    id: "online-date-night",
    title: "Online Date Night",
    shortDescription:
      "A remote dinner planned by Gianmaria: menu, time and dress code.",
    description:
      "A proper date night, at a distance. Gianmaria organises everything: the menu, the time and the dress code. Each of us sits at our own table, dressed accordingly, and pretends the screen is a very small restaurant.",
    category: "dates",
    rarity: "premium",
    copies: 2,
    terms: [
      "Valid once per ticket.",
      "Menu, time and dress code are announced by Gianmaria in advance.",
      "Pyjama bottoms are permitted below camera level.",
    ],
  },
  {
    id: "delivery-surprise",
    title: "Delivery Surprise",
    shortDescription: "Dinner or dessert delivered to your door. Unannounced.",
    description:
      "A surprise dinner or dessert, delivered straight to your door without warning. Gianmaria chooses, pays and waits nervously to hear whether it was a good choice.",
    category: "food",
    rarity: "premium",
    copies: 2,
    terms: [
      "Valid once per ticket.",
      "Subject to delivery coverage, time zones and common sense.",
    ],
  },
  {
    id: "handwritten-letter",
    title: "Handwritten Letter",
    shortDescription: "A real paper letter, sent by actual post.",
    description:
      "A real letter on real paper, written by hand and sent by post like it is a historical drama. Delivery speed depends on the postal service, which is outside Gianmaria's jurisdiction.",
    category: "romantic",
    rarity: "premium",
    copies: 2,
    terms: [
      "Valid once per ticket.",
      "Handwriting quality is not guaranteed. Feelings are.",
    ],
  },
  {
    id: "virtual-trip",
    title: "Virtual Trip",
    shortDescription:
      "A city neither of us has visited, toured on Street View, with dinner to match.",
    description:
      "We choose a city where neither of us has ever been, walk around it together on Street View, and then have dinner with that city's food — each in our own kitchen, both pretending to be tourists.",
    category: "dates",
    rarity: "premium",
    terms: [
      "Valid once.",
      "The city must be new to both of us. Lying about past holidays voids the ticket.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  {
    id: "flowers-at-your-door",
    title: "Flowers at Your Door",
    shortDescription: "Surprise flowers delivered to your home.",
    description:
      "Flowers delivered to your door, as a surprise, on a day that is not your birthday and not an apology. Simply flowers. Suspicious, but true.",
    category: "romantic",
    rarity: "premium",
    terms: [
      "Valid once.",
      "Delivery date is chosen by Gianmaria to preserve the surprise.",
    ],
  },
  {
    id: "quiz-night-about-us",
    title: "Quiz Night About Us",
    shortDescription:
      "A quiz about us, written by Gianmaria. The winner picks the next date.",
    description:
      "A quiz night about us, prepared by Gianmaria and played on a video call. Questions range from easy to “how do you remember that?”. The winner chooses the next date, and the loser accepts it graciously.",
    category: "dates",
    rarity: "premium",
    terms: [
      "Valid once.",
      "Gianmaria writes the questions and still might lose.",
      "Subject to Wi-Fi, time zones and common sense.",
    ],
  },
  // Legendary
  {
    id: "im-coming-to-you",
    title: "I'm Coming to You",
    shortDescription: "Gianmaria gets on a plane and comes to you.",
    description:
      "The big one. Gianmaria gets on a plane and comes to you. Dates are agreed together; the airport hug is mandatory and will be longer than socially acceptable.",
    category: "dates",
    rarity: "legendary",
    terms: [
      "Valid once.",
      "Dates are agreed together, subject to flights, work and common sense.",
    ],
  },
  {
    id: "ticket-sponsored",
    title: "Ticket Sponsored",
    shortDescription: "Your next ticket to come and see Gianmaria is on him.",
    description:
      "The next ticket to come and see Gianmaria is paid for by Gianmaria. You choose the dates; he handles the booking and the slightly alarming checkout page.",
    category: "dates",
    rarity: "legendary",
    terms: [
      "Valid once.",
      "Covers one trip to Gianmaria, with dates agreed together.",
    ],
  },
  {
    id: "plan-the-reunion",
    title: "Plan the Reunion",
    shortDescription:
      "The day we see each other again, organised by Gianmaria from start to finish.",
    description:
      "The day we finally see each other again is planned by Gianmaria from the first minute to the last. You only need to turn up and be impressed. Constructive feedback is accepted the following day.",
    category: "dates",
    rarity: "legendary",
    terms: [
      "Valid once.",
      "Applies to one reunion day. Valentina only needs to show up.",
    ],
  },
  {
    id: "surprise-visit",
    title: "Surprise Visit",
    shortDescription:
      "He arrives without warning. You only know “something will happen” within a month.",
    description:
      "Gianmaria turns up without warning. Once redeemed, the only information you receive is that “something will happen” within a month. Please keep your door answerable and your hair however you like it.",
    category: "dates",
    rarity: "legendary",
    terms: [
      "Valid once.",
      "Arrival within one month of redemption. No further details will be leaked.",
      "Subject to flights, work and common sense.",
    ],
  },
];

function code(position: number): string {
  return `GV-D${String(position).padStart(2, "0")}`;
}

function buildApartCoupons(): Coupon[] {
  const result: Coupon[] = [];
  for (const definition of definitions) {
    const copies = definition.copies ?? 1;
    for (let index = 1; index <= copies; index++) {
      const position = result.length + 1;
      result.push({
        id: copies > 1 ? `${definition.id}-${index}` : definition.id,
        code: code(position),
        title: definition.title,
        shortDescription: definition.shortDescription,
        description: definition.description,
        category: definition.category,
        rarity: definition.rarity,
        setting: "apart",
        type: "standard",
        status: "available",
        redeemable: true,
        challengeId: null,
        unlockCondition: null,
        secret: false,
        series: copies > 1 ? { index, total: copies } : undefined,
        createdAt: new Date(Date.UTC(2026, 10, 16, 8, position)).toISOString(),
        redeemedAt: null,
        terms: definition.terms ?? DEFAULT_TERMS,
      });
    }
  }
  return result;
}

export const apartCoupons: readonly Coupon[] = buildApartCoupons();

/** The coupon that glows when the next reunion is less than a week away. */
export const REUNION_COUPON_ID = "im-coming-to-you";
