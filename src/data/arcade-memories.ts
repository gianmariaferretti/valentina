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
/** Original symbol placeholders. Dates/cities remain unclaimed until personal media is supplied. */
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
].map(([id, title, category]) => ({
  id,
  title,
  symbol: id,
  city: null,
  date: null,
  caption: `${title} · illustration placeholder`,
  category: category as ArcadeMemory["category"],
}));
