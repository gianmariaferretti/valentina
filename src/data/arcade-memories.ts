import { getMediaAsset } from "./media.ts";

export interface ArcadeMemory {
  readonly id: string;
  readonly title: string;
  readonly city: string | null;
  readonly date: string | null;
  /** Optional canonical src/data/media.ts asset IDs, not duplicated media metadata. */
  readonly image?: string;
  readonly matchingImage?: string;
  readonly caption: string;
  readonly category: "travel" | "object" | "nature";
  readonly symbol: string;
}
/** Identical photographs form each pair; stable IDs/order preserve seeded game transcripts. */
const photographPairs: Readonly<Record<string, string>> = {
  plane: "paris-disneyland",
  train: "rome-cover",
  camera: "paris-bite",
  compass: "bari-cover",
  key: "bari-street",
  coffee: "polignano-table",
  moon: "accettura-evening",
  sun: "polignano-a-mare-cover",
  mountain: "accettura-cover",
  umbrella: "paris-cover",
  music: "accettura-portrait",
  book: "accettura-dome",
  anchor: "polignano-boat",
  flower: "matera-cover",
};

/** Four original symbols remain until further approved photographs are supplied. */
export const arcadeMemories: readonly ArcadeMemory[] = [
  ["plane", "Plane", "travel"],
  ["train", "Train", "travel"],
  ["camera", "Camera", "object"],
  ["compass", "Compass", "travel"],
  ["key", "Key", "object"],
  ["coffee", "Coffee", "object"],
  ["moon", "Moon", "nature"],
  ["sun", "Sun", "nature"],
  ["mountain", "Mountain", "nature"],
  ["umbrella", "Umbrella", "object"],
  ["music", "Music", "object"],
  ["book", "Book", "object"],
  ["anchor", "Anchor", "travel"],
  ["flower", "Flower", "nature"],
  ["shell", "Shell", "nature"],
  ["bike", "Bicycle", "travel"],
  ["tree", "Tree", "nature"],
  ["gift", "Gift", "object"],
].map(([id, title, category]) => {
  const image = photographPairs[id];
  const photograph = image ? getMediaAsset(image) : null;
  return {
    id,
    title: photograph?.caption ?? title,
    symbol: id,
    city: photograph?.location?.label ?? null,
    date: photograph?.date ?? null,
    image,
    matchingImage: image,
    caption: photograph?.caption ?? `${title} · illustration placeholder`,
    category: category as ArcadeMemory["category"],
  };
});
