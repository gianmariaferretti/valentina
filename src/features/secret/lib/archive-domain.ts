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
