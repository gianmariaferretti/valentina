import { getMediaAsset } from "@/data/media";
import type { Award } from "@/features/awards/types";

export const awards: readonly Award[] = [
  {
    id: "best-trip",
    category: "Best Trip",
    description: "A journey into nature, unlike anything else.",
    nominees: [
      {
        id: "accettura",
        name: "Accettura",
        citation: "A journey into nature, unlike anything else.",
      },
      {
        id: "naples",
        name: "Naples",
        citation: "A trip with an unexpected and very much unwanted guest.",
      },
      {
        id: "hamburg",
        name: "Hamburg",
        citation: "Rain, followed by more rain. And then some more rain.",
      },
    ],
    winnerId: "accettura",
    photo: getMediaAsset("accettura-cover"),
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "wide",
  },
  {
    id: "best-date",
    category: "Best Date",
    description: "Art, romance and excellent company.",
    nominees: [
      {
        id: "national-gallery",
        name: "National Gallery",
        citation: "Art, romance and excellent company.",
      },
      {
        id: "mexican-dinner",
        name: "Mexican Dinner",
        citation: "A little Mexico, a lot of opinions.",
      },
      {
        id: "parco-della-musica-concert",
        name: "Parco della Musica Concert",
        citation: "An evening with a soundtrack.",
      },
      {
        id: "sushi-date",
        name: "Sushi Date",
        citation: "An excellent excuse to order too much.",
      },
    ],
    winnerId: "national-gallery",
    photo: getMediaAsset("award-golden-hour"),
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "standard",
  },
  {
    id: "best-dinner",
    category: "Best Dinner",
    description: "A taste of Colombia, made with love.",
    nominees: [
      {
        id: "colombian-dinner-by-valentina",
        name: "Colombian Dinner by Valentina",
        citation: "A taste of Colombia, made with love.",
      },
      {
        id: "italian-dinner-by-gianmaria",
        name: "Italian Dinner by Gianmaria",
        citation: "Italy's culinary reputation was on the line.",
      },
      {
        id: "dinner-at-the-national-gallery",
        name: "Dinner at the National Gallery",
        citation: "Art first, dinner second. Or perhaps the opposite.",
      },
    ],
    winnerId: "colombian-dinner-by-valentina",
    photo: getMediaAsset("award-table-for-two"),
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "standard",
  },
  {
    id: "best-photo",
    category: "Best Photo",
    description: "Some photographs capture a moment. This one captured a bite.",
    nominees: [
      {
        id: "the-gianmaria-bite-photo",
        name: "The Gianmaria Bite Photo",
        citation:
          "Some photographs capture a moment. This one captured a bite.",
      },
    ],
    winnerId: "the-gianmaria-bite-photo",
    photo: getMediaAsset("paris-bite"),
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "wide",
  },
  {
    id: "best-surprise",
    category: "Best Surprise",
    description: "Flowers, delivered when least expected.",
    nominees: [
      {
        id: "surprise-flowers",
        name: "Surprise Flowers",
        citation: "Flowers, delivered when least expected.",
      },
      {
        id: "the-necklace-gift",
        name: "The Necklace Gift",
        citation: "A little something to remember.",
      },
    ],
    winnerId: "surprise-flowers",
    photo: getMediaAsset("award-jury-evidence"),
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "standard",
  },
  {
    id: "worst-restaurant",
    category: "Worst Restaurant",
    description:
      "An unforgettable dining experience. Unfortunately, not for the right reasons.",
    nominees: [
      {
        id: "the-cave-restaurant-in-matera",
        name: "The Cave Restaurant in Matera",
        citation:
          "An unforgettable dining experience. Unfortunately, not for the right reasons.",
      },
      {
        id: "the-empty-restaurant-in-matera",
        name: "The Empty Restaurant in Matera",
        citation: "So exclusive that nobody else was there.",
      },
    ],
    winnerId: "the-cave-restaurant-in-matera",
    photo: { ...getMediaAsset("award-table-for-two"), position: "70% 50%" },
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "standard",
  },
  {
    id: "most-pointless-argument",
    category: "Most Pointless Argument",
    status: "cancelled",
    description:
      "After careful consideration, the jury has concluded that Valentina is always right.",
    nominees: [],
    winnerId: null,
    photo: getMediaAsset("award-jury-evidence"),
    sticker: { variant: "classified", text: "CASE CLOSED", rotation: -4 },
    presentation: "wide",
  },
  {
    id: "best-dramatic-performance",
    category: "Best Dramatic Performance",
    description:
      "An emotionally powerful performance, with a plot nobody fully understood.",
    nominees: [
      {
        id: "valentina-mad-at-me-for-no-reason",
        name: "Valentina Mad at Me for No Reason",
        citation:
          "An emotionally powerful performance, with a plot nobody fully understood.",
      },
      {
        id: "gianmaria-playing-the-mad-card",
        name: "Gianmaria Playing the Mad Card",
        citation: "A bold attempt at dramatic negotiation.",
      },
    ],
    winnerId: "valentina-mad-at-me-for-no-reason",
    photo: { ...getMediaAsset("award-golden-hour"), position: "35% 50%" },
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
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
    id: "most-beautiful-city",
    category: "Most Beautiful City",
    description: "A small place with an unfair advantage.",
    nominees: [
      {
        id: "pignola",
        name: "Pignola",
        citation: "A small place with an unfair advantage.",
      },
      {
        id: "rome",
        name: "Rome",
        citation: "The Eternal City. A respectable second choice.",
      },
      {
        id: "cartagena",
        name: "Cartagena",
        citation: "Caribbean colours and serious competition.",
      },
      {
        id: "hamburg",
        name: "Hamburg",
        citation: "Beautiful, even when the weather disagrees.",
      },
    ],
    winnerId: "pignola",
    photo: { ...getMediaAsset("award-table-for-two"), position: "30% 50%" },
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
    presentation: "wide",
  },
  {
    id: "most-annoying",
    category: "Most Annoying",
    description: "An international incident in pronunciation.",
    nominees: [
      {
        id: "gianmaria-s-english",
        name: "Gianmaria's English",
        citation: "An international incident in pronunciation.",
      },
    ],
    winnerId: "gianmaria-s-english",
    photo: { ...getMediaAsset("award-instant-film"), position: "40% 50%" },
    sticker: { variant: "jury", text: "Jury certified", rotation: -2 },
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
];

export function getAwardWinner(award: Award) {
  if (award.status === "cancelled") return null;
  const winner = award.nominees.find(
    (nominee) => nominee.id === award.winnerId,
  );

  if (!winner) {
    throw new Error(`Award ${award.id} has no matching winner nominee.`);
  }

  return winner;
}
