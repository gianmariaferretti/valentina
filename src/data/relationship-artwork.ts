export interface RelationshipArtworkSlot {
  readonly id: string;
  readonly backgroundMediaId: string | null;
  readonly valentinaMediaId: string | null;
  readonly gianmariaMediaId: string | null;
  readonly replacementNote: string;
}
/** IDs reference the canonical media registry. Null is an intentional paper placeholder. */
export const relationshipArtwork: readonly RelationshipArtworkSlot[] = [
  "morning-kitchen",
  "lunch-street",
  "incident-cafe",
  "shopping-window",
  "dinner-table",
  "night-sofa",
].map((id) => ({
  id,
  backgroundMediaId: null,
  valentinaMediaId: null,
  gianmariaMediaId: null,
  replacementNote: `Add authorised personal artwork for ${id} to src/data/media.ts, then reference its IDs here. Do not invent real V&G photographs.`,
}));
