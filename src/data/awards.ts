import { getMediaAsset } from "@/data/media";
import type { Award } from "@/features/awards/types";

export const awards = [
  {
    id: "best-trip",
    category: "Best Trip",
    description:
      "For outstanding achievement in leaving home, finding snacks and making a place permanently ours.",
    nominees: [
      {
        id: "london",
        name: "London",
        citation: "Rain, long walks and excellent main-character energy.",
      },
      {
        id: "rome",
        name: "Rome",
        citation: "A persuasive campaign built almost entirely on pasta.",
      },
      {
        id: "paris",
        name: "Paris",
        citation: "Photogenic, expensive and aware of both facts.",
      },
      {
        id: "hamburg-brussels",
        name: "Hamburg + Brussels",
        citation: "A joint entry with elite train-window scenery.",
      },
    ],
    winnerId: "london",
    photo: getMediaAsset("award-city-night"),
    evidence: { label: "Jury note", value: "Won by one dramatic umbrella." },
    sticker: { variant: "trophy", text: "Grand tour", rotation: -3 },
    presentation: "wide",
  },
  {
    id: "best-date",
    category: "Best Date",
    description:
      "Awarded for chemistry, timing and successfully avoiding all unnecessary logistics.",
    nominees: [
      {
        id: "no-timetable",
        name: "The date with no timetable",
        citation: "No bookings. No alarms. Miraculously, no crisis.",
      },
      {
        id: "museum-rain",
        name: "The museum in the rain",
        citation: "Culture used responsibly as weather protection.",
      },
      {
        id: "late-walk",
        name: "The walk that became dinner",
        citation: "A strong pivot from steps to carbohydrates.",
      },
    ],
    winnerId: "no-timetable",
    photo: getMediaAsset("award-golden-hour"),
    sticker: { variant: "jury", text: "Unanimous-ish", rotation: 2 },
    presentation: "standard",
  },
  {
    id: "best-dinner",
    category: "Best Dinner",
    description:
      "For the meal that made every later reservation compete with a highly edited memory.",
    nominees: [
      {
        id: "roman-table",
        name: "The tiny Roman table",
        citation: "Barely enough room for plates. Exactly enough room for us.",
      },
      {
        id: "home-pasta",
        name: "Emergency pasta at home",
        citation: "Technically improvised. Emotionally Michelin-starred.",
      },
      {
        id: "hotel-breakfast",
        name: "The suspiciously long breakfast",
        citation: "A three-course refusal to begin the day.",
      },
    ],
    winnerId: "roman-table",
    photo: getMediaAsset("award-table-for-two"),
    evidence: {
      label: "Material evidence",
      value: "One menu kept as a souvenir.",
    },
    sticker: {
      variant: "girlfriend-approved",
      text: "Excellent pasta",
      rotation: -2,
    },
    presentation: "standard",
  },
  {
    id: "best-photo",
    category: "Best Photo",
    description:
      "Recognising one frame that survived bad lighting, movement and repeated demands for another one.",
    nominees: [
      {
        id: "paris-platform",
        name: "The blurry Paris platform photo",
        citation: "Technically imperfect. Annoyingly perfect anyway.",
      },
      {
        id: "london-window",
        name: "The London window reflection",
        citation: "Two people, one city and seventeen attempts.",
      },
      {
        id: "rome-selfie",
        name: "The Rome selfie with the stranger",
        citation: "Unexpected supporting actor. Strong composition.",
      },
    ],
    winnerId: "paris-platform",
    photo: getMediaAsset("award-instant-film"),
    evidence: {
      label: "Camera roll",
      value: "47 near-identical alternatives rejected.",
    },
    sticker: { variant: "legendary", text: "No retakes", rotation: 3 },
    presentation: "wide",
  },
  {
    id: "best-surprise",
    category: "Best Surprise",
    description:
      "For operational secrecy maintained despite Gianmaria behaving like a man carrying a visible secret.",
    nominees: [
      {
        id: "nearly-spoiled",
        name: "The one Gianmaria nearly spoiled",
        citation: "A masterclass in suspicious calendar behaviour.",
      },
      {
        id: "flowers-random",
        name: "The flowers for no reason",
        citation: "No anniversary. No apology. Deeply confusing.",
      },
      {
        id: "hidden-dessert",
        name: "The hidden dessert",
        citation: "Discovered early but politely treated as classified.",
      },
    ],
    winnerId: "nearly-spoiled",
    photo: getMediaAsset("award-jury-evidence"),
    sticker: { variant: "classified", text: "Still classified", rotation: -4 },
    presentation: "standard",
  },
  {
    id: "worst-restaurant",
    category: "Worst Restaurant",
    description:
      "A solemn memorial to money, time and the meal we could have made better at home.",
    nominees: [
      {
        id: "decorative-portions",
        name: "The place with decorative portions",
        citation: "Three leaves, one sauce dot and breathtaking confidence.",
      },
      {
        id: "airport-sandwich",
        name: "The airport sandwich incident",
        citation: "Dry enough to qualify as carry-on building material.",
      },
      {
        id: "forty-minute-water",
        name: "The forty-minute water service",
        citation: "Hydration presented as a long-form narrative.",
      },
    ],
    winnerId: "decorative-portions",
    photo: { ...getMediaAsset("award-table-for-two"), position: "70% 50%" },
    evidence: { label: "Final verdict", value: "We ordered pizza afterwards." },
    sticker: { variant: "jury", text: "Zero stars", rotation: 2 },
    presentation: "standard",
  },
  {
    id: "most-pointless-argument",
    category: "Most Pointless Argument",
    description:
      "Honouring a disagreement with high production value and absolutely no lasting consequence.",
    nominees: [
      {
        id: "map-upside-down",
        name: "Was the map upside down?",
        citation: "It was digital. The question somehow continued.",
      },
      {
        id: "window-open",
        name: "The window temperature summit",
        citation: "Four degrees. Two positions. No diplomatic progress.",
      },
      {
        id: "correct-exit",
        name: "Which exit was ‘obviously’ correct",
        citation: "Both routes arrived within sixty seconds of each other.",
      },
    ],
    winnerId: "map-upside-down",
    photo: getMediaAsset("award-jury-evidence"),
    evidence: {
      label: "Duration",
      value: "Eleven minutes that belong to history now.",
    },
    sticker: { variant: "jury", text: "No winner, really", rotation: -2 },
    presentation: "wide",
  },
  {
    id: "best-dramatic-performance",
    category: "Best Dramatic Performance",
    description:
      "For transforming a manageable situation into an awards-season emotional event.",
    nominees: [
      {
        id: "gianmaria-cold",
        name: "Gianmaria with a mild cold",
        citation: "Fragile. Brave. Temperature: 37.1°C.",
      },
      {
        id: "valentina-hanger",
        name: "Valentina before dinner",
        citation: "A committed performance resolved by bread.",
      },
      {
        id: "both-delay",
        name: "Both of us after a train delay",
        citation: "An ensemble piece with no interval.",
      },
    ],
    winnerId: "gianmaria-cold",
    photo: { ...getMediaAsset("award-golden-hour"), position: "35% 50%" },
    evidence: {
      label: "Jury citation",
      value: "Asked if he would ever recover.",
    },
    sticker: { variant: "trophy", text: "Standing ovation", rotation: 3 },
    presentation: "standard",
  },
  {
    id: "worst-navigation-skills",
    category: "Worst Navigation Skills",
    description:
      "Presented to the person whose confidence remained impressively unrelated to the route.",
    nominees: [
      {
        id: "gianmaria-navigation",
        name: "Gianmaria",
        citation: "Said ‘trust me’ three minutes before the U-turn.",
      },
      {
        id: "valentina-navigation",
        name: "Valentina",
        citation: "Strong intuition. Selective relationship with street names.",
      },
      {
        id: "phone-battery",
        name: "The phone on 2%",
        citation: "Unhelpful, stressed and technically blameless.",
      },
    ],
    winnerId: "gianmaria-navigation",
    photo: { ...getMediaAsset("award-city-night"), position: "75% 50%" },
    evidence: {
      label: "Distance added",
      value: "1.8 km, described as ‘basically here’.",
    },
    sticker: { variant: "location", text: "Recalculating", rotation: -3 },
    presentation: "standard",
  },
  {
    id: "longest-getting-ready",
    category: "Longest Getting Ready",
    description:
      "For an artist who understands that a stated departure time is merely the beginning of negotiations.",
    nominees: [
      {
        id: "valentina-ready",
        name: "Valentina",
        citation: "Created three complete looks and rejected two masterpieces.",
      },
      {
        id: "gianmaria-hair",
        name: "Gianmaria fixing his hair",
        citation: "Publicly estimated at two minutes. Independently disputed.",
      },
      {
        id: "shared-luggage",
        name: "Both of us packing one bag",
        citation: "A collaborative work in five acts.",
      },
    ],
    winnerId: "valentina-ready",
    photo: { ...getMediaAsset("award-instant-film"), position: "65% 50%" },
    evidence: {
      label: "Official delay",
      value: "Enough time for Gianmaria to sit down again.",
    },
    sticker: {
      variant: "girlfriend-approved",
      text: "Worth the wait",
      rotation: 2,
    },
    presentation: "wide",
  },
  {
    id: "most-likely-to-fall-asleep",
    category: "Most Likely to Fall Asleep",
    description:
      "Recognising consistent excellence in missing the final twenty minutes of carefully selected entertainment.",
    nominees: [
      {
        id: "gianmaria-asleep",
        name: "Gianmaria",
        citation: "Claims he was listening with his eyes closed.",
      },
      {
        id: "valentina-asleep",
        name: "Valentina",
        citation: "Strong sofa record; weaker under travel conditions.",
      },
      {
        id: "both-asleep",
        name: "Both, during the film we insisted on",
        citation: "A rare and beautifully synchronized draw.",
      },
    ],
    winnerId: "gianmaria-asleep",
    photo: { ...getMediaAsset("award-golden-hour"), position: "80% 40%" },
    sticker: {
      variant: "boyfriend-certified",
      text: "Still awake",
      rotation: -2,
    },
    presentation: "standard",
  },
  {
    id: "best-excuse",
    category: "Best Excuse",
    description:
      "For verbal innovation under pressure, delivered with a straight face and very little supporting evidence.",
    nominees: [
      {
        id: "train-early",
        name: "‘The train was early’",
        citation: "Gianmaria’s bold reinterpretation of being late.",
      },
      {
        id: "did-not-hear",
        name: "‘I genuinely didn’t hear you’",
        citation: "Submitted repeatedly by both parties.",
      },
      {
        id: "research",
        name: "‘I was researching the restaurant’",
        citation: "Search history contained forty-seven unrelated tabs.",
      },
    ],
    winnerId: "train-early",
    photo: getMediaAsset("award-jury-evidence"),
    evidence: {
      label: "Legal status",
      value: "Appeal rejected without comment.",
    },
    sticker: { variant: "classified", text: "Plausible-ish", rotation: 3 },
    presentation: "standard",
  },
  {
    id: "most-expensive-taste",
    category: "Most Expensive Taste",
    description:
      "Celebrating the rare ability to identify the premium option before seeing a single price.",
    nominees: [
      {
        id: "valentina-taste",
        name: "Valentina",
        citation: "Can detect cashmere through a closed browser tab.",
      },
      {
        id: "gianmaria-hotels",
        name: "Gianmaria choosing hotels",
        citation: "Calls the upgrade ‘better value’ with professional calm.",
      },
      {
        id: "shared-dessert",
        name: "Our inability to skip dessert",
        citation: "A joint financial policy with excellent outcomes.",
      },
    ],
    winnerId: "valentina-taste",
    photo: { ...getMediaAsset("award-table-for-two"), position: "30% 50%" },
    evidence: {
      label: "Prize value",
      value: "Classified for budgetary stability.",
    },
    sticker: { variant: "legendary", text: "Premium only", rotation: -3 },
    presentation: "wide",
  },
  {
    id: "most-annoying",
    category: "Most Annoying",
    description:
      "A lifetime-achievement category for tiny habits performed with relentless consistency.",
    nominees: [
      {
        id: "gianmaria-what",
        name: "Gianmaria saying ‘what?’ then answering",
        citation: "The response was apparently loading the entire time.",
      },
      {
        id: "valentina-five-minutes",
        name: "Valentina’s ‘five minutes’",
        citation: "A flexible unit not recognised by international standards.",
      },
      {
        id: "shared-food-question",
        name: "Asking what to eat, rejecting everything",
        citation: "A celebrated V&G ensemble tradition.",
      },
    ],
    winnerId: "gianmaria-what",
    photo: { ...getMediaAsset("award-instant-film"), position: "40% 50%" },
    evidence: {
      label: "Public response",
      value: "Valentina did not require deliberation.",
    },
    sticker: { variant: "jury", text: "By popular demand", rotation: 2 },
    presentation: "standard",
  },
  {
    id: "relationship-mvp",
    category: "Relationship MVP",
    description:
      "The evening’s highest honour, recognising patience, brilliance and one year of elite-level girlfriend performance.",
    nominees: [
      {
        id: "valentina-mvp",
        name: "VALENTINA",
        citation: "Carried the romance, the taste and several conversations.",
      },
      {
        id: "gianmaria-mvp",
        name: "Gianmaria",
        citation: "Submitted his own nomination. Confidence noted by the jury.",
      },
      {
        id: "us-mvp",
        name: "Us",
        citation: "A suspiciously strong joint entry for future consideration.",
      },
    ],
    winnerId: "valentina-mvp",
    photo: getMediaAsset("award-golden-hour"),
    evidence: {
      label: "Jury decision",
      value: "Unanimous. Gianmaria abstained under protest.",
    },
    sticker: { variant: "trophy", text: "Relationship MVP", rotation: -3 },
    prize: "Prize: unfortunately, another year with Gianmaria.",
    presentation: "finale",
  },
] as const satisfies readonly Award[];

export function getAwardWinner(award: Award) {
  const winner = award.nominees.find(
    (nominee) => nominee.id === award.winnerId,
  );

  if (!winner) {
    throw new Error(`Award ${award.id} has no matching winner nominee.`);
  }

  return winner;
}
