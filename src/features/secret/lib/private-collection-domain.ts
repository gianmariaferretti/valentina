import {
  ARCHIVE_REDUCED_REVEAL_MS,
  ARCHIVE_REVEAL_MS,
  type ArchiveProof,
} from "./archive-domain.ts";

export const collectionIntents = [
  "browse",
  "payment-request",
  "exchange-agreement",
] as const;
export type CollectionIntent = (typeof collectionIntents)[number];
export type CollectionView =
  | "collection"
  | "checkout"
  | "exchange"
  | "payment-requested"
  | "exchange-confirmed";
export type CollectionActionResult =
  | { readonly ok: true; readonly view: CollectionView }
  | { readonly ok: false; readonly message: string };

export function isCollectionIntent(value: unknown): value is CollectionIntent {
  return collectionIntents.some((intent) => intent === value);
}

/** Independent of coupon persistence: a revealed file still works during a DB outage. */
export function canAccessPrivateCollection(
  proof: ArchiveProof | null,
  now: number,
): boolean {
  return Boolean(
    proof &&
    ["photo-reveal", "final-reveal"].includes(proof.stage) &&
    proof.ageConfirmed === true &&
    Number.isFinite(now) &&
    Number.isFinite(proof.expiresAt) &&
    proof.expiresAt > now &&
    proof.imageServedAt !== null &&
    Number.isFinite(proof.imageServedAt) &&
    proof.imageServedAt > 0 &&
    [ARCHIVE_REVEAL_MS, ARCHIVE_REDUCED_REVEAL_MS].includes(
      proof.revealDuration,
    ) &&
    now - proof.imageServedAt >= proof.revealDuration,
  );
}

export function collectionReceipt(intent: CollectionIntent): CollectionView {
  switch (intent) {
    case "browse":
      return "collection";
    case "payment-request":
      return "payment-requested";
    case "exchange-agreement":
      return "exchange-confirmed";
  }
}
