/** Pure rules for doodles: what may be stored, and where. */

export const DOODLE_BUCKET = "vg-doodles";

/** Limits on what one upload may carry. */
export const MAX_SCENE_BYTES = 1_500_000;
export const MAX_PREVIEW_BYTES = 2_000_000;
export const MAX_ELEMENTS = 4000;

export type DoodleAuthor = "valentina" | "gianmaria";

export interface Doodle {
  readonly id: string;
  readonly author: DoodleAuthor;
  readonly title: string | null;
  readonly replyTo: string | null;
  readonly favorite: boolean;
  readonly createdAt: string;
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isDoodleId = (id: unknown): id is string =>
  typeof id === "string" && ID.test(id);

export function doodleObjects(id: string) {
  if (!isDoodleId(id)) throw new Error("Invalid doodle id.");
  return {
    scene: `doodles/${id}.json`,
    preview: `doodles/${id}.png`,
  } as const;
}

/** The first bytes of every PNG file. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

export type SceneCheck =
  { ok: true; json: string; elements: number } | { ok: false; reason: string };

/**
 * An Excalidraw scene as sent by the browser: JSON of type "excalidraw",
 * with at least one visible element and no more than the limits allow.
 * Embedded images ("files") are refused: doodles are drawings.
 */
export function checkScene(raw: string): SceneCheck {
  if (raw.length > MAX_SCENE_BYTES)
    return { ok: false, reason: "The drawing is too big." };
  let scene: unknown;
  try {
    scene = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "The drawing could not be read." };
  }
  if (
    !scene ||
    typeof scene !== "object" ||
    (scene as { type?: unknown }).type !== "excalidraw" ||
    !Array.isArray((scene as { elements?: unknown }).elements)
  )
    return { ok: false, reason: "That is not a drawing." };
  const elements = (scene as { elements: { isDeleted?: boolean }[] }).elements;
  const visible = elements.filter((element) => !element?.isDeleted).length;
  if (visible === 0) return { ok: false, reason: "Draw something first." };
  if (elements.length > MAX_ELEMENTS)
    return { ok: false, reason: "The drawing is too big." };
  const files = (scene as { files?: unknown }).files;
  if (files && typeof files === "object" && Object.keys(files).length > 0)
    return { ok: false, reason: "Pictures can't go in a doodle." };
  return { ok: true, json: JSON.stringify(scene), elements: visible };
}

/** Newest first, favourites are just marked (the album is a timeline). */
export function sortDoodles<T extends { createdAt: string }>(
  doodles: readonly T[],
): T[] {
  return doodles.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}
