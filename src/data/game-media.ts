export interface GameMediaPlaceholder {
  readonly id: string;
  readonly assetId: string;
  readonly replacementNote: string;
}

/**
 * Games reference these stable slots instead of inventing personal media.
 * Each slot references the canonical `src/data/media.ts` registry instead of
 * duplicating image metadata. Replace that asset there when Gianmaria supplies
 * the real photographs; keep these IDs stable so card pairings remain compatible.
 */
export const gameMediaPlaceholders = [
  {
    id: "memory-slot-beginning",
    assetId: "brussels-cover",
    replacementNote:
      "Replace with a photograph from the beginning of Year One.",
  },
  {
    id: "memory-slot-trip",
    assetId: "london-transit",
    replacementNote: "Replace with a favourite V&G travel photograph.",
  },
  {
    id: "memory-slot-city",
    assetId: "hamburg-cover",
    replacementNote:
      "Replace with a city photograph from the shared media registry.",
  },
  {
    id: "memory-slot-dinner",
    assetId: "rome-cover",
    replacementNote: "Replace with a real dinner photograph.",
  },
  {
    id: "memory-slot-random",
    assetId: "paris-cover",
    replacementNote: "Replace with a candid V&G photograph.",
  },
  {
    id: "memory-slot-favourite",
    assetId: "award-golden-hour",
    replacementNote: "Replace with a favourite photograph from Year One.",
  },
  {
    id: "memory-slot-chaos",
    assetId: "award-jury-evidence",
    replacementNote: "Replace with photographic evidence of harmless chaos.",
  },
  {
    id: "memory-slot-next",
    assetId: "brussels-transit",
    replacementNote: "Replace with a photograph chosen for the final pair.",
  },
] as const satisfies readonly GameMediaPlaceholder[];
