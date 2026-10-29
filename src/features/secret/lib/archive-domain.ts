export const archiveStages = [
  "discovery",
  "curiosity",
  "age-confirmation",
  "point-of-no-return",
  "sealed-file",
  "photo-reveal",
  "final-reveal",
] as const;
export type ArchiveStage = (typeof archiveStages)[number];
export const ARCHIVE_REVEAL_MS = 10_000;
export const ARCHIVE_REDUCED_REVEAL_MS = 700;
export const ARCHIVE_SESSION_MS = 30 * 60 * 1000;

/** Puzzle answers are not authorization secrets; server-side proof gates media. */
export function validArchiveDate(value: unknown): boolean {
  return Boolean(
    value &&
    typeof value === "object" &&
    "day" in value &&
    value.day === "31" &&
    "month" in value &&
    value.month === "10" &&
    "year" in value &&
    value.year === "2025",
  );
}

export function validArchiveReference(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value[0] === "31" &&
    value[1] === "V" &&
    value[2] === "G"
  );
}

export function validArchiveAuthorization(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value[0] === "inspect" &&
    value[1] === "unseal" &&
    value[2] === "authorize"
  );
}

export interface ArchiveProof {
  readonly stage: ArchiveStage;
  readonly expiresAt: number;
  readonly ageConfirmed: boolean;
  readonly imageServedAt: number | null;
  readonly revealDuration: number;
}

export function nextArchiveStage(
  stage: ArchiveStage,
  ageConfirmed: boolean,
): ArchiveStage | null {
  if (stage === "age-confirmation" && !ageConfirmed) return null;
  if (stage === "photo-reveal" || stage === "final-reveal") return null;
  return archiveStages[archiveStages.indexOf(stage) + 1] ?? null;
}

export function canCompleteArchive(proof: ArchiveProof, now: number): boolean {
  return (
    proof.stage === "photo-reveal" &&
    proof.ageConfirmed &&
    proof.expiresAt > now &&
    proof.imageServedAt !== null &&
    now - proof.imageServedAt >= proof.revealDuration
  );
}
