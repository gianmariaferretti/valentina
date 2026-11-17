import "server-only";

import { arcadeMemories } from "@/data/arcade-memories";
import { getMediaAsset } from "@/data/media";

/** What a Memory card shows face up. Built on the server (audit A6). */
export interface MemoryFace {
  readonly id: string;
  readonly title: string;
  readonly src: string | null;
}

export function loadMemoryFaces(): readonly MemoryFace[] {
  return arcadeMemories.map((memory) => ({
    id: memory.id,
    title: memory.title,
    src: memory.image ? (getMediaAsset(memory.image)?.src ?? null) : null,
  }));
}
