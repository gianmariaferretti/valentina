/**
 * Memory game card identities, in game order. Public on purpose: the client
 * needs them to deal the seeded deck. Titles, captions and photographs are
 * loaded on the server (src/features/games/lib/memory-faces.ts).
 */
export const arcadeMemoryIds = [
  "plane",
  "train",
  "camera",
  "compass",
  "key",
  "coffee",
  "moon",
  "sun",
  "mountain",
  "umbrella",
  "music",
  "book",
  "anchor",
  "flower",
  "shell",
  "bike",
  "tree",
  "gift",
] as const;

export type ArcadeMemoryId = (typeof arcadeMemoryIds)[number];
