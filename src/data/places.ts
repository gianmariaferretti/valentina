import type { Destination } from "@/features/map/types";

const imagePlaceholders = {
  city: "/images/map/city-placeholder.svg",
  detail: "/images/map/detail-placeholder.svg",
  transit: "/images/map/transit-placeholder.svg",
} as const;

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
    coverImage: {
      src: imagePlaceholders.city,
      alt: "Editorial placeholder for a future London photograph",
      caption: "London cover photograph reserved",
    },
    galleryImages: [
      {
        src: imagePlaceholders.detail,
        alt: "Placeholder for a detail photographed in London",
        caption: "The detail we will remember",
      },
      {
        src: imagePlaceholders.transit,
        alt: "Placeholder for a London travel photograph",
        caption: "In transit, allegedly organised",
      },
      {
        src: imagePlaceholders.city,
        alt: "Placeholder for a second London city photograph",
        caption: "One more frame for the evidence file",
      },
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
    coverImage: {
      src: imagePlaceholders.city,
      alt: "Editorial placeholder for a future Rome photograph",
      caption: "Rome cover photograph reserved",
    },
    galleryImages: [
      {
        src: imagePlaceholders.transit,
        alt: "Placeholder for a Rome arrival photograph",
        caption: "Arrival, with confidence",
      },
      {
        src: imagePlaceholders.detail,
        alt: "Placeholder for a small Rome memory",
        caption: "The thing we almost walked past",
      },
      {
        src: imagePlaceholders.city,
        alt: "Placeholder for a second Rome city photograph",
        caption: "Evidence from somewhere beautiful",
      },
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
    coverImage: {
      src: imagePlaceholders.city,
      alt: "Editorial placeholder for a future Paris photograph",
      caption: "Paris cover photograph reserved",
    },
    galleryImages: [
      {
        src: imagePlaceholders.detail,
        alt: "Placeholder for a Paris detail photograph",
        caption: "Small detail, unfairly photogenic",
      },
      {
        src: imagePlaceholders.city,
        alt: "Placeholder for a Paris street photograph",
        caption: "A street we will identify later",
      },
      {
        src: imagePlaceholders.transit,
        alt: "Placeholder for a Paris transit photograph",
        caption: "Two tickets, one questionable route",
      },
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
    coverImage: {
      src: imagePlaceholders.city,
      alt: "Editorial placeholder for a future Hamburg photograph",
      caption: "Hamburg cover photograph reserved",
    },
    galleryImages: [
      {
        src: imagePlaceholders.city,
        alt: "Placeholder for a Hamburg city photograph",
        caption: "Northern light, eventually",
      },
      {
        src: imagePlaceholders.transit,
        alt: "Placeholder for a Hamburg travel photograph",
        caption: "The efficient-looking part",
      },
      {
        src: imagePlaceholders.detail,
        alt: "Placeholder for a Hamburg detail photograph",
        caption: "A detail filed for later",
      },
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
    coverImage: {
      src: imagePlaceholders.city,
      alt: "Editorial placeholder for a future Brussels photograph",
      caption: "Brussels cover photograph reserved",
    },
    galleryImages: [
      {
        src: imagePlaceholders.detail,
        alt: "Placeholder for a Brussels detail photograph",
        caption: "Evidence, probably edible",
      },
      {
        src: imagePlaceholders.city,
        alt: "Placeholder for a Brussels city photograph",
        caption: "A compact city, properly framed",
      },
      {
        src: imagePlaceholders.transit,
        alt: "Placeholder for a Brussels travel photograph",
        caption: "Departure time: optimistically precise",
      },
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
