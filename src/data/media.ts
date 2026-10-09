import type {
  GalleryMediaAsset,
  GalleryPresentation,
  MediaAsset,
  MediaCategory,
  MediaLocation,
  MediaSurface,
} from "@/features/media/types";

const sources = {
  city: { src: "/images/map/city-placeholder.svg", width: 1600, height: 1000 },
  detail: {
    src: "/images/map/detail-placeholder.svg",
    width: 1200,
    height: 1500,
  },
  transit: {
    src: "/images/map/transit-placeholder.svg",
    width: 1600,
    height: 1100,
  },
  cityNight: {
    src: "/images/awards/city-night-placeholder.svg",
    width: 1600,
    height: 1000,
  },
  goldenHour: {
    src: "/images/awards/golden-hour-placeholder.svg",
    width: 1600,
    height: 1000,
  },
  instantFilm: {
    src: "/images/awards/instant-film-placeholder.svg",
    width: 1600,
    height: 1000,
  },
  juryEvidence: {
    src: "/images/awards/jury-evidence-placeholder.svg",
    width: 1600,
    height: 1000,
  },
  tableForTwo: {
    src: "/images/awards/table-for-two-placeholder.svg",
    width: 1600,
    height: 1000,
  },
} as const;

type SourceKey = keyof typeof sources;

interface MediaDefinition {
  readonly id: string;
  readonly source: SourceKey;
  readonly alt: string;
  readonly caption: string;
  readonly dateLabel?: string;
  readonly location?: MediaLocation | null;
  readonly category?: MediaCategory;
  readonly featured?: boolean;
  readonly relatedPlace?: string | null;
  readonly position?: string;
  readonly surfaces: readonly MediaSurface[];
  readonly gallery?: MediaAsset["gallery"];
}

function defineMedia({
  id,
  source,
  alt,
  caption,
  dateLabel = "Date to be added",
  location = null,
  category = "trips",
  featured = false,
  relatedPlace = null,
  position,
  surfaces,
  gallery,
}: MediaDefinition): MediaAsset {
  return {
    id,
    ...sources[source],
    alt,
    caption,
    date: null,
    dateLabel,
    location,
    category,
    featured,
    relatedPlace,
    position,
    surfaces,
    gallery,
  };
}

const placeLocations = {
  london: { label: "London, United Kingdom", code: "LON" },
  rome: { label: "Rome, Italy", code: "ROM" },
  paris: { label: "Paris, France", code: "PAR" },
  hamburg: { label: "Hamburg, Germany", code: "HAM" },
  brussels: { label: "Brussels, Belgium", code: "BRU" },
  "polignano-a-mare": { label: "Polignano a Mare, Italy" },
  matera: { label: "Matera, Italy" },
  accettura: { label: "Accettura, Italy" },
  bari: { label: "Bari, Italy" },
} as const satisfies Record<string, MediaLocation>;

interface TravelPhotoDefinition {
  readonly id: string;
  readonly place: keyof typeof placeLocations;
  readonly alt: string;
  readonly caption: string;
  readonly landscape?: boolean;
  readonly category?: MediaCategory;
  readonly featured?: boolean;
  /** Map-only photos never enter the Gallery or Memory game. */
  readonly mapOnly?: boolean;
  readonly gallery: GalleryPresentation;
}

/** Supplied travel photographs. Order is editorial, not chronological. */
export const travelPhotos: readonly MediaAsset[] = (
  [
    {
      id: "paris-cover",
      place: "paris",
      category: "us",
      featured: true,
      alt: "A couple leaning together on the grass in Paris",
      caption: "Paris · on the grass",
      gallery: { format: "editorial", size: "hero", rotation: 0, tape: "none" },
    },
    {
      id: "accettura-cover",
      place: "accettura",
      featured: true,
      alt: "Rocky peaks and green hills beneath a cloud-filled blue sky near Accettura",
      caption: "Accettura · the view",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: -2,
        tape: "cream",
      },
    },
    {
      id: "bari-cover",
      place: "bari",
      alt: "Boats moored in front of a waterfront building in Bari",
      caption: "Bari · by the water",
      gallery: {
        format: "editorial",
        size: "portrait",
        rotation: 0,
        tape: "none",
      },
    },
    {
      id: "polignano-boat",
      place: "polignano-a-mare",
      alt: "A woman in a blue shirt sitting on a boat beside the coastline at Polignano a Mare",
      caption: "Polignano a Mare · on the water",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: 2,
        tape: "yellow",
      },
    },
    {
      id: "paris-bite",
      place: "paris",
      category: "us",
      featured: true,
      alt: "A playful bite captured in a couple's mirror photograph in Paris",
      caption: "The Gianmaria Bite Photo",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: -1,
        tape: "rose",
      },
    },
    {
      id: "matera-cover",
      place: "matera",
      alt: "Stone buildings and terraced rooftops across Matera beneath a clear blue sky",
      caption: "Matera · rooftops",
      gallery: {
        format: "editorial",
        size: "portrait",
        rotation: 0,
        tape: "none",
      },
    },
    {
      id: "accettura-evening",
      place: "accettura",
      alt: "Sunset over hills viewed from beneath a geodesic dome near Accettura",
      caption: "Accettura · evening light",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: 2,
        tape: "clear",
      },
    },
    {
      id: "rome-cover",
      place: "rome",
      category: "us",
      alt: "A woman posing in a pink-lit room beneath a Barbie sign in Rome",
      caption: "Rome · a little pink",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: -2,
        tape: "cream",
      },
    },
    {
      id: "paris-disneyland",
      place: "paris",
      landscape: true,
      alt: "A couple posing with drinks at Disneyland Paris",
      caption: "Disneyland Paris",
      gallery: { format: "editorial", size: "wide", rotation: 0, tape: "none" },
    },
    {
      id: "polignano-a-mare-cover",
      place: "polignano-a-mare",
      alt: "White coastal buildings above turquoise water at Polignano a Mare",
      caption: "Polignano a Mare · the coastline",
      gallery: {
        format: "editorial",
        size: "portrait",
        rotation: 0,
        tape: "none",
      },
    },
    {
      id: "accettura-portrait",
      place: "accettura",
      landscape: true,
      category: "us",
      alt: "A woman's selfie with hillside houses and green slopes behind her near Accettura",
      caption: "Accettura · a frame together with the view",
      gallery: {
        format: "polaroid",
        size: "wide",
        rotation: -1,
        tape: "yellow",
      },
    },
    {
      id: "bari-street",
      place: "bari",
      category: "us",
      alt: "A couple taking a selfie in a narrow street in Bari",
      caption: "Bari · a street-side frame",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: 2,
        tape: "cream",
      },
    },
    {
      id: "accettura-dome",
      place: "accettura",
      alt: "A terrace overlooking hills through the frame of a geodesic dome near Accettura",
      caption: "Accettura · from the terrace",
      gallery: {
        format: "photo-strip",
        size: "wide",
        rotation: -1,
        tape: "none",
      },
    },
    {
      id: "polignano-table",
      place: "polignano-a-mare",
      category: "food",
      alt: "A woman eating an ice cream at a table in Polignano a Mare",
      caption: "Polignano a Mare · ice cream",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: 1,
        tape: "rose",
      },
    },
    {
      id: "paris-quiet-frame",
      place: "paris",
      category: "us",
      mapOnly: true,
      alt: "A couple resting together beneath a blanket in Paris",
      caption: "Paris · a quiet frame",
      gallery: {
        format: "polaroid",
        size: "portrait",
        rotation: 0,
        tape: "none",
      },
    },
  ] satisfies readonly TravelPhotoDefinition[]
).map((definition: TravelPhotoDefinition): MediaAsset => ({
  id: definition.id,
  src: `/images/travel/${definition.id}.webp`,
  width: definition.landscape ? 1600 : 1200,
  height: definition.landscape ? 1200 : 1600,
  alt: definition.alt,
  caption: definition.caption,
  date: null,
  dateLabel: "Date to be added",
  location:
    definition.id === "paris-disneyland"
      ? { label: "Disneyland Paris, France" }
      : placeLocations[definition.place],
  category: definition.category ?? "trips",
  featured: definition.featured ?? false,
  relatedPlace: definition.place,
  surfaces: definition.mapOnly ? ["map"] : ["map", "gallery", "awards", "home"],
  gallery: definition.mapOnly ? undefined : definition.gallery,
}));

export function getTravelPhotosForPlace(slug: string): readonly MediaAsset[] {
  return travelPhotos.filter((photo) => photo.relatedPlace === slug);
}

const placeholderMediaAssets = [
  ...(
    [
      ["polignano-a-mare", "Polignano a Mare"],
      ["matera", "Matera"],
      ["accettura", "Accettura"],
      ["amalfi-coast", "Amalfi Coast"],
      ["bari", "Bari"],
    ] as const
  ).flatMap(([slug, city]) =>
    (["cover", "detail", "transit"] as const).map((kind) =>
      defineMedia({
        id: `${slug}-${kind}`,
        source: kind === "cover" ? "city" : kind,
        alt: `Illustration placeholder for a future ${city} photograph`,
        caption: `${city} · photograph to be added`,
        location: { label: `${city}, Italy` },
        relatedPlace: slug,
        surfaces: ["map"],
      }),
    ),
  ),
  defineMedia({
    id: "london-cover",
    source: "cityNight",
    alt: "Editorial placeholder for a future London photograph",
    caption: "London after dark, photograph reserved",
    location: placeLocations.london,
    relatedPlace: "london",
    featured: true,
    position: "50% 45%",
    surfaces: ["gallery", "map", "home"],
    gallery: {
      format: "editorial",
      size: "hero",
      rotation: 0,
      tape: "none",
      note: "the city did most of the work",
    },
  }),
  defineMedia({
    id: "london-detail",
    source: "detail",
    alt: "Placeholder for a detail photographed in London",
    caption: "The detail we will remember",
    location: placeLocations.london,
    relatedPlace: "london",
    category: "random",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "london-transit",
    source: "transit",
    alt: "Placeholder for a London travel photograph",
    caption: "In transit, allegedly organised",
    location: placeLocations.london,
    relatedPlace: "london",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "photo-strip",
      size: "wide",
      rotation: -1,
      tape: "none",
      note: "platform evidence · frame 03",
    },
  }),
  defineMedia({
    id: "london-second-frame",
    source: "city",
    alt: "Placeholder for a second London city photograph",
    caption: "One more frame for the evidence file",
    location: placeLocations.london,
    relatedPlace: "london",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "rome-cover",
    source: "tableForTwo",
    alt: "Editorial placeholder for a future Rome photograph",
    caption: "A Roman table for two",
    location: placeLocations.rome,
    relatedPlace: "rome",
    category: "food",
    featured: true,
    surfaces: ["gallery", "map", "awards"],
    gallery: {
      format: "editorial",
      size: "wide",
      rotation: 0,
      tape: "none",
      note: "ordered too much, correctly",
    },
  }),
  defineMedia({
    id: "rome-arrival",
    source: "transit",
    alt: "Placeholder for a Rome arrival photograph",
    caption: "Arrival, with confidence",
    location: placeLocations.rome,
    relatedPlace: "rome",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "rome-detail",
    source: "detail",
    alt: "Placeholder for a small Rome memory",
    caption: "The thing we almost walked past",
    location: placeLocations.rome,
    relatedPlace: "rome",
    category: "random",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "polaroid",
      size: "portrait",
      rotation: -3,
      tape: "cream",
      note: "worth the detour",
    },
  }),
  defineMedia({
    id: "rome-city-frame",
    source: "city",
    alt: "Placeholder for a second Rome city photograph",
    caption: "Evidence from somewhere beautiful",
    location: placeLocations.rome,
    relatedPlace: "rome",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "paris-cover",
    source: "instantFilm",
    alt: "Editorial placeholder for a future Paris photograph",
    caption: "Paris, imperfectly in focus",
    location: placeLocations.paris,
    relatedPlace: "paris",
    category: "us",
    featured: true,
    position: "50% 48%",
    surfaces: ["gallery", "map", "awards"],
    gallery: {
      format: "polaroid",
      size: "portrait",
      rotation: 3,
      tape: "clear",
      note: "47 attempts later",
    },
  }),
  defineMedia({
    id: "paris-detail",
    source: "detail",
    alt: "Placeholder for a Paris detail photograph",
    caption: "Small detail, unfairly photogenic",
    location: placeLocations.paris,
    relatedPlace: "paris",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "paris-street",
    source: "city",
    alt: "Placeholder for a Paris street photograph",
    caption: "A street we will identify later",
    location: placeLocations.paris,
    relatedPlace: "paris",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "editorial",
      size: "standard",
      rotation: 0,
      tape: "none",
    },
  }),
  defineMedia({
    id: "paris-transit",
    source: "transit",
    alt: "Placeholder for a Paris transit photograph",
    caption: "Two tickets, one questionable route",
    location: placeLocations.paris,
    relatedPlace: "paris",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "hamburg-cover",
    source: "city",
    alt: "Editorial placeholder for a future Hamburg photograph",
    caption: "Northern light, eventually",
    location: placeLocations.hamburg,
    relatedPlace: "hamburg",
    position: "50% 48%",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "editorial",
      size: "wide",
      rotation: 0,
      tape: "none",
      note: "excellent posture, northern edition",
    },
  }),
  defineMedia({
    id: "hamburg-city-frame",
    source: "city",
    alt: "Placeholder for a Hamburg city photograph",
    caption: "One quiet frame by the water",
    location: placeLocations.hamburg,
    relatedPlace: "hamburg",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "hamburg-transit",
    source: "transit",
    alt: "Placeholder for a Hamburg travel photograph",
    caption: "The efficient-looking part",
    location: placeLocations.hamburg,
    relatedPlace: "hamburg",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "photo-strip",
      size: "standard",
      rotation: 2,
      tape: "none",
      note: "train window studies",
    },
  }),
  defineMedia({
    id: "hamburg-detail",
    source: "detail",
    alt: "Placeholder for a Hamburg detail photograph",
    caption: "A detail filed for later",
    location: placeLocations.hamburg,
    relatedPlace: "hamburg",
    category: "random",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "brussels-cover",
    source: "goldenHour",
    alt: "Editorial placeholder for a future Brussels photograph",
    caption: "Brussels in very flattering light",
    location: placeLocations.brussels,
    relatedPlace: "brussels",
    category: "us",
    featured: true,
    surfaces: ["gallery", "map", "home"],
    gallery: {
      format: "editorial",
      size: "hero",
      rotation: 0,
      tape: "none",
      note: "yes, we looked this composed",
    },
  }),
  defineMedia({
    id: "brussels-detail",
    source: "detail",
    alt: "Placeholder for a Brussels detail photograph",
    caption: "Evidence, probably edible",
    location: placeLocations.brussels,
    relatedPlace: "brussels",
    category: "food",
    surfaces: ["gallery", "map"],
    gallery: {
      format: "polaroid",
      size: "small",
      rotation: -4,
      tape: "yellow",
      note: "snack tribunal exhibit A",
    },
  }),
  defineMedia({
    id: "brussels-city-frame",
    source: "city",
    alt: "Placeholder for a Brussels city photograph",
    caption: "A compact city, properly framed",
    location: placeLocations.brussels,
    relatedPlace: "brussels",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "brussels-transit",
    source: "transit",
    alt: "Placeholder for a Brussels travel photograph",
    caption: "Departure time: optimistically precise",
    location: placeLocations.brussels,
    relatedPlace: "brussels",
    surfaces: ["map"],
  }),
  defineMedia({
    id: "award-city-night",
    source: "cityNight",
    alt: "Editorial night-city photograph placeholder",
    caption: "One city, one dramatic umbrella",
    location: placeLocations.london,
    relatedPlace: "london",
    position: "50% 45%",
    featured: true,
    surfaces: ["gallery", "awards", "secret"],
    gallery: {
      format: "editorial",
      size: "standard",
      rotation: 0,
      tape: "none",
    },
  }),
  defineMedia({
    id: "award-golden-hour",
    source: "goldenHour",
    alt: "Warm golden-hour portrait placeholder",
    caption: "Golden hour, professionally exploited",
    location: null,
    relatedPlace: null,
    category: "us",
    featured: true,
    surfaces: ["gallery", "awards", "home"],
    gallery: {
      format: "editorial",
      size: "wide",
      rotation: 0,
      tape: "none",
      note: "relationship propaganda department",
    },
  }),
  defineMedia({
    id: "award-instant-film",
    source: "instantFilm",
    alt: "Instant-film style photograph placeholder",
    caption: "The frame that survived selection",
    location: null,
    relatedPlace: null,
    category: "us",
    surfaces: ["gallery", "awards"],
    gallery: {
      format: "polaroid",
      size: "portrait",
      rotation: 4,
      tape: "rose",
      note: "no retakes (after 47 retakes)",
    },
  }),
  defineMedia({
    id: "award-jury-evidence",
    source: "juryEvidence",
    alt: "Classified photographic evidence placeholder",
    caption: "Classified evidence, details redacted",
    location: null,
    relatedPlace: null,
    category: "random",
    surfaces: ["gallery", "awards", "secret"],
    gallery: {
      format: "photo-strip",
      size: "small",
      rotation: -2,
      tape: "none",
      note: "do not zoom in",
    },
  }),
  defineMedia({
    id: "award-table-for-two",
    source: "tableForTwo",
    alt: "Editorial table-for-two photograph placeholder",
    caption: "Dinner for two, opinions for seven",
    location: placeLocations.rome,
    relatedPlace: "rome",
    category: "food",
    featured: true,
    surfaces: ["gallery", "awards"],
    gallery: {
      format: "editorial",
      size: "standard",
      rotation: 0,
      tape: "none",
      note: "dessert was never optional",
    },
  }),
] as const satisfies readonly MediaAsset[];

/** Stable cover IDs replace placeholders without duplicating image metadata. */
export const mediaAssets: readonly MediaAsset[] = [
  ...travelPhotos,
  ...placeholderMediaAssets.filter(
    (asset) => !travelPhotos.some((photo) => photo.id === asset.id),
  ),
];

export function getMediaAsset(id: string): MediaAsset {
  const asset = mediaAssets.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Media asset ${id} is not registered.`);
  return asset;
}

export function getGalleryMedia(): readonly GalleryMediaAsset[] {
  // Once real photos exist, don't interleave repeated placeholder illustrations.
  return (travelPhotos.length ? travelPhotos : mediaAssets).filter(
    (asset): asset is GalleryMediaAsset =>
      asset.surfaces.includes("gallery") && Boolean(asset.gallery),
  );
}

export function getMediaForSurface(
  surface: MediaSurface,
): readonly MediaAsset[] {
  return mediaAssets.filter((asset) => asset.surfaces.includes(surface));
}
