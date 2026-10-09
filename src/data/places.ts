import { getMediaAsset } from "@/data/media";
import type { Destination } from "@/features/map/types";

export const places = [
  {
    id: "place-london",
    slug: "london",
    city: "London",
    country: "United Kingdom",
    coordinates: [-0.1276, 51.5072],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Flights, weather commentary and a chapter waiting for its definitive caption.",
    longDescription: [
      "This London page is ready for the real version of the story: where the day started, what almost went to plan and which tiny detail became the one worth keeping.",
      "For now, the structure preserves the shape of the memory without inventing it. Replace this copy when the photographs and exact dates join the archive.",
    ],
    coverImage: getMediaAsset("london-cover"),
    galleryImages: [
      getMediaAsset("london-detail"),
      getMediaAsset("london-transit"),
      getMediaAsset("london-second-frame"),
    ],
    stickers: [
      { id: "london-code", kind: "airport-code", text: "LON", rotation: -3 },
      {
        id: "london-coordinates",
        kind: "coordinates",
        text: "51.5072° N · 0.1276° W",
        rotation: 2,
      },
      { id: "london-date", kind: "date", text: "DATE PENDING", rotation: -1 },
      {
        id: "london-note",
        kind: "annotation",
        text: "weather review pending",
        rotation: -4,
      },
    ],
    memories: [
      {
        id: "london-memory-1",
        title: "The first note",
        note: "Reserved for the sentence that immediately makes sense only to us.",
      },
      {
        id: "london-memory-2",
        title: "The useful detail",
        note: "Add the place, snack or minor logistical crisis worth preserving.",
      },
      {
        id: "london-memory-3",
        title: "Official verdict",
        note: "Girlfriend review pending. Editorial standards remain extremely high.",
      },
    ],
    atlasOrder: 1,
    travelCode: "LON",
    stampTone: "burgundy",
  },
  {
    id: "place-rome",
    slug: "rome",
    city: "Rome",
    country: "Italy",
    coordinates: [12.4964, 41.9028],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "A Roman pin for the story, the food and whichever plan was immediately abandoned.",
    longDescription: [
      "Rome already supplies the scenery; this page is deliberately waiting for the part only Valentina and Gianmaria can provide. The real route, the unplanned pause and the photo that survived selection all belong here.",
      "The layout is complete, but the memory stays honest: no invented itinerary, no borrowed romance and no suspiciously perfect travel copy.",
    ],
    coverImage: getMediaAsset("rome-cover"),
    galleryImages: [
      getMediaAsset("rome-arrival"),
      getMediaAsset("rome-detail"),
      getMediaAsset("rome-city-frame"),
    ],
    stickers: [
      { id: "rome-code", kind: "airport-code", text: "ROM", rotation: 3 },
      {
        id: "rome-coordinates",
        kind: "coordinates",
        text: "41.9028° N · 12.4964° E",
        rotation: -2,
      },
      { id: "rome-date", kind: "date", text: "DATE PENDING", rotation: 1 },
      {
        id: "rome-note",
        kind: "annotation",
        text: "one more street, then food",
        rotation: -5,
      },
    ],
    memories: [
      {
        id: "rome-memory-1",
        title: "The plan",
        note: "Reserved for the plan we made before Rome had other ideas.",
      },
      {
        id: "rome-memory-2",
        title: "The table",
        note: "A future note about the meal that deserves permanent archival status.",
      },
      {
        id: "rome-memory-3",
        title: "The detour",
        note: "Probably unnecessary. Almost certainly worth remembering.",
      },
    ],
    atlasOrder: 2,
    travelCode: "ROM",
    stampTone: "mustard",
  },
  {
    id: "place-paris",
    slug: "paris",
    city: "Paris",
    country: "France",
    coordinates: [2.3522, 48.8566],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "A place with impossible standards, now waiting for our considerably less polished evidence.",
    longDescription: [
      "Paris does not need a generic love story, and neither does this archive. This section is prepared for the exact version: the neighbourhood, the running joke and the moment that escaped the camera.",
      "Until those details arrive, the page stays intentionally editorial rather than pretending a stock itinerary was ours.",
    ],
    coverImage: getMediaAsset("paris-cover"),
    galleryImages: [
      getMediaAsset("paris-detail"),
      getMediaAsset("paris-street"),
      getMediaAsset("paris-transit"),
    ],
    stickers: [
      { id: "paris-code", kind: "airport-code", text: "PAR", rotation: -4 },
      {
        id: "paris-coordinates",
        kind: "coordinates",
        text: "48.8566° N · 2.3522° E",
        rotation: 2,
      },
      { id: "paris-date", kind: "date", text: "DATE PENDING", rotation: -2 },
      {
        id: "paris-note",
        kind: "annotation",
        text: "editorially overdressed",
        rotation: 4,
      },
    ],
    memories: [
      {
        id: "paris-memory-1",
        title: "The photograph",
        note: "Reserved for the one photo that will make the final cut immediately.",
      },
      {
        id: "paris-memory-2",
        title: "The order",
        note: "Add what we ordered and the inevitably strong review that followed.",
      },
      {
        id: "paris-memory-3",
        title: "The line",
        note: "A place for the sentence one of us still quotes with no context.",
      },
    ],
    atlasOrder: 3,
    travelCode: "PAR",
    stampTone: "blue",
  },
  {
    id: "place-hamburg",
    slug: "hamburg",
    city: "Hamburg",
    country: "Germany",
    coordinates: [9.9937, 53.5511],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Harbour air, northern light and space reserved for a very specific shared memory.",
    longDescription: [
      "Hamburg gets a quieter chapter in the atlas: strong lines, cool colour and room for the memory to do the work. The real account can be added without changing the design around it.",
      "No chronology is assumed here. This is an editorial pin, ready for exact dates and the version of events approved by both parties.",
    ],
    coverImage: getMediaAsset("hamburg-cover"),
    galleryImages: [
      getMediaAsset("hamburg-city-frame"),
      getMediaAsset("hamburg-transit"),
      getMediaAsset("hamburg-detail"),
    ],
    stickers: [
      { id: "hamburg-code", kind: "airport-code", text: "HAM", rotation: 2 },
      {
        id: "hamburg-coordinates",
        kind: "coordinates",
        text: "53.5511° N · 9.9937° E",
        rotation: -2,
      },
      { id: "hamburg-date", kind: "date", text: "DATE PENDING", rotation: 3 },
      {
        id: "hamburg-note",
        kind: "annotation",
        text: "north, with excellent posture",
        rotation: -3,
      },
    ],
    memories: [
      {
        id: "hamburg-memory-1",
        title: "By the water",
        note: "Reserved for a harbour note, or a correction if we were nowhere near it.",
      },
      {
        id: "hamburg-memory-2",
        title: "The forecast",
        note: "Weather data unavailable. Commentary will almost certainly be preserved.",
      },
      {
        id: "hamburg-memory-3",
        title: "The quiet bit",
        note: "A future memory that does not need a dramatic caption.",
      },
    ],
    atlasOrder: 4,
    travelCode: "HAM",
    stampTone: "blue",
  },
  {
    id: "place-brussels",
    slug: "brussels",
    city: "Brussels",
    country: "Belgium",
    coordinates: [4.3517, 50.8503],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "A compact capital, a generous archive slot and absolutely no neutral opinions about snacks.",
    longDescription: [
      "Brussels closes the first edition of this atlas, though not a timeline. Its page is ready for the real photographs, dates and the snack ranking that will inevitably require formal review.",
      "Everything personal remains configurable in data, so the final memory can be specific without being hard-coded into the interface.",
    ],
    coverImage: getMediaAsset("brussels-cover"),
    galleryImages: [
      getMediaAsset("brussels-detail"),
      getMediaAsset("brussels-city-frame"),
      getMediaAsset("brussels-transit"),
    ],
    stickers: [
      { id: "brussels-code", kind: "airport-code", text: "BRU", rotation: -3 },
      {
        id: "brussels-coordinates",
        kind: "coordinates",
        text: "50.8503° N · 4.3517° E",
        rotation: 1,
      },
      {
        id: "brussels-date",
        kind: "date",
        text: "DATE PENDING",
        rotation: -2,
      },
      {
        id: "brussels-note",
        kind: "annotation",
        text: "snack tribunal in session",
        rotation: 4,
      },
    ],
    memories: [
      {
        id: "brussels-memory-1",
        title: "The ranking",
        note: "Reserved for the food ranking and any dissenting opinion.",
      },
      {
        id: "brussels-memory-2",
        title: "The square",
        note: "Add the exact place once the photographic evidence is admitted.",
      },
      {
        id: "brussels-memory-3",
        title: "The verdict",
        note: "A future note approved by a two-person, highly biased committee.",
      },
    ],
    atlasOrder: 5,
    travelCode: "BRU",
    stampTone: "mustard",
  },
  {
    id: "place-polignano-a-mare",
    slug: "polignano-a-mare",
    city: "Polignano a Mare",
    country: "Italy",
    coordinates: [17.22149, 40.99221],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Clifftop streets, sea views and a place that clearly earned a pin.",
    longDescription: [
      "This destination is now part of the V&G atlas and is ready for the exact dates, photographs and memory that belong here.",
      "The location is real; the personal story stays intentionally open until the final Year One archive is filled in.",
    ],
    coverImage: getMediaAsset("polignano-a-mare-cover"),
    galleryImages: [
      getMediaAsset("polignano-a-mare-detail"),
      getMediaAsset("polignano-a-mare-transit"),
    ],
    stickers: [
      {
        id: "polignano-a-mare-code",
        kind: "airport-code",
        text: "POL",
        rotation: -3,
      },
      {
        id: "polignano-a-mare-coordinates",
        kind: "coordinates",
        text: "40.9922° N · 17.2215° E",
        rotation: 2,
      },
      {
        id: "polignano-a-mare-date",
        kind: "date",
        text: "DATE PENDING",
        rotation: -1,
      },
      {
        id: "polignano-a-mare-note",
        kind: "annotation",
        text: "V+G evidence pending",
        rotation: 3,
      },
    ],
    memories: [
      {
        id: "polignano-a-mare-memory-1",
        title: "The arrival",
        note: "Reserved for the first detail worth keeping.",
      },
      {
        id: "polignano-a-mare-memory-2",
        title: "The evidence",
        note: "Add the photograph, place or story that belongs here.",
      },
      {
        id: "polignano-a-mare-memory-3",
        title: "The verdict",
        note: "Final caption pending joint editorial approval.",
      },
    ],
    atlasOrder: 6,
    travelCode: "POL",
    stampTone: "blue",
  },
  {
    id: "place-matera",
    slug: "matera",
    city: "Matera",
    country: "Italy",
    coordinates: [16.6024, 40.6695],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Stone, light and one of the most unmistakable stops in the V&G atlas.",
    longDescription: [
      "This destination is now part of the V&G atlas and is ready for the exact dates, photographs and memory that belong here.",
      "The location is real; the personal story stays intentionally open until the final Year One archive is filled in.",
    ],
    coverImage: getMediaAsset("matera-cover"),
    galleryImages: [
      getMediaAsset("matera-detail"),
      getMediaAsset("matera-transit"),
    ],
    stickers: [
      { id: "matera-code", kind: "airport-code", text: "MTR", rotation: 3 },
      {
        id: "matera-coordinates",
        kind: "coordinates",
        text: "40.6695° N · 16.6024° E",
        rotation: -2,
      },
      { id: "matera-date", kind: "date", text: "DATE PENDING", rotation: -1 },
      {
        id: "matera-note",
        kind: "annotation",
        text: "V+G evidence pending",
        rotation: 3,
      },
    ],
    memories: [
      {
        id: "matera-memory-1",
        title: "The arrival",
        note: "Reserved for the first detail worth keeping.",
      },
      {
        id: "matera-memory-2",
        title: "The evidence",
        note: "Add the photograph, place or story that belongs here.",
      },
      {
        id: "matera-memory-3",
        title: "The verdict",
        note: "Final caption pending joint editorial approval.",
      },
    ],
    atlasOrder: 7,
    travelCode: "MTR",
    stampTone: "mustard",
  },
  {
    id: "place-accettura",
    slug: "accettura",
    city: "Accettura",
    country: "Italy",
    coordinates: [16.1588, 40.492],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "A Basilicata chapter with its own coordinates and room for the real story.",
    longDescription: [
      "This destination is now part of the V&G atlas and is ready for the exact dates, photographs and memory that belong here.",
      "The location is real; the personal story stays intentionally open until the final Year One archive is filled in.",
    ],
    coverImage: getMediaAsset("accettura-cover"),
    galleryImages: [
      getMediaAsset("accettura-detail"),
      getMediaAsset("accettura-transit"),
    ],
    stickers: [
      { id: "accettura-code", kind: "airport-code", text: "ACC", rotation: -3 },
      {
        id: "accettura-coordinates",
        kind: "coordinates",
        text: "40.4920° N · 16.1588° E",
        rotation: 2,
      },
      {
        id: "accettura-date",
        kind: "date",
        text: "DATE PENDING",
        rotation: -1,
      },
      {
        id: "accettura-note",
        kind: "annotation",
        text: "V+G evidence pending",
        rotation: 3,
      },
    ],
    memories: [
      {
        id: "accettura-memory-1",
        title: "The arrival",
        note: "Reserved for the first detail worth keeping.",
      },
      {
        id: "accettura-memory-2",
        title: "The evidence",
        note: "Add the photograph, place or story that belongs here.",
      },
      {
        id: "accettura-memory-3",
        title: "The verdict",
        note: "Final caption pending joint editorial approval.",
      },
    ],
    atlasOrder: 8,
    travelCode: "ACC",
    stampTone: "burgundy",
  },
  {
    id: "place-amalfi-coast",
    slug: "amalfi-coast",
    city: "Amalfi Coast",
    country: "Italy",
    coordinates: [14.604, 40.6311],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Coastline, impossible roads and scenery with absolutely no need for exaggeration.",
    longDescription: [
      "This destination is now part of the V&G atlas and is ready for the exact dates, photographs and memory that belong here.",
      "The location is real; the personal story stays intentionally open until the final Year One archive is filled in.",
    ],
    coverImage: getMediaAsset("amalfi-coast-cover"),
    galleryImages: [
      getMediaAsset("amalfi-coast-detail"),
      getMediaAsset("amalfi-coast-transit"),
    ],
    stickers: [
      {
        id: "amalfi-coast-code",
        kind: "airport-code",
        text: "AMA",
        rotation: 3,
      },
      {
        id: "amalfi-coast-coordinates",
        kind: "coordinates",
        text: "40.6311° N · 14.6040° E",
        rotation: -2,
      },
      {
        id: "amalfi-coast-date",
        kind: "date",
        text: "DATE PENDING",
        rotation: -1,
      },
      {
        id: "amalfi-coast-note",
        kind: "annotation",
        text: "V+G evidence pending",
        rotation: 3,
      },
    ],
    memories: [
      {
        id: "amalfi-coast-memory-1",
        title: "The arrival",
        note: "Reserved for the first detail worth keeping.",
      },
      {
        id: "amalfi-coast-memory-2",
        title: "The evidence",
        note: "Add the photograph, place or story that belongs here.",
      },
      {
        id: "amalfi-coast-memory-3",
        title: "The verdict",
        note: "Final caption pending joint editorial approval.",
      },
    ],
    atlasOrder: 9,
    travelCode: "AMA",
    stampTone: "blue",
  },
  {
    id: "place-bari",
    slug: "bari",
    city: "Bari",
    country: "Italy",
    coordinates: [16.852, 41.1187],
    dateRange: { start: null, end: null, label: "Date to be added" },
    shortDescription:
      "Adriatic air, old streets and another coordinate in the Year One evidence file.",
    longDescription: [
      "This destination is now part of the V&G atlas and is ready for the exact dates, photographs and memory that belong here.",
      "The location is real; the personal story stays intentionally open until the final Year One archive is filled in.",
    ],
    coverImage: getMediaAsset("bari-cover"),
    galleryImages: [
      getMediaAsset("bari-detail"),
      getMediaAsset("bari-transit"),
    ],
    stickers: [
      { id: "bari-code", kind: "airport-code", text: "BRI", rotation: -3 },
      {
        id: "bari-coordinates",
        kind: "coordinates",
        text: "41.1187° N · 16.8520° E",
        rotation: 2,
      },
      { id: "bari-date", kind: "date", text: "DATE PENDING", rotation: -1 },
      {
        id: "bari-note",
        kind: "annotation",
        text: "V+G evidence pending",
        rotation: 3,
      },
    ],
    memories: [
      {
        id: "bari-memory-1",
        title: "The arrival",
        note: "Reserved for the first detail worth keeping.",
      },
      {
        id: "bari-memory-2",
        title: "The evidence",
        note: "Add the photograph, place or story that belongs here.",
      },
      {
        id: "bari-memory-3",
        title: "The verdict",
        note: "Final caption pending joint editorial approval.",
      },
    ],
    atlasOrder: 10,
    travelCode: "BRI",
    stampTone: "mustard",
  },
] as const satisfies readonly Destination[];

export function getPlace(slug: string): Destination | undefined {
  return places.find((place) => place.slug === slug);
}

export function getAdjacentPlaces(place: Destination): {
  previous: Destination;
  next: Destination;
} {
  const currentIndex = places.findIndex(
    (candidate) => candidate.id === place.id,
  );
  const previous = places[(currentIndex - 1 + places.length) % places.length];
  const next = places[(currentIndex + 1) % places.length];

  return { previous, next };
}
