import type { Metadata } from "next";
import { privateCollection } from "@/data/private-collection";
import { archiveScenes, investigationDocuments } from "@/data/spicy-archive";
import { SpicyArchive } from "@/features/secret/components/spicy-archive";
import { loadArchiveProgress } from "@/features/secret/actions/archive-actions";
import { readArchiveProof } from "@/features/secret/lib/archive-session";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "The Spicy Archive",
  robots: { index: false, follow: false },
};

export default async function SecretPage() {
  await requireAccessSession();
  const imageAlt =
    process.env.SPICY_ARCHIVE_IMAGE_ALT ||
    (process.env.SPICY_ARCHIVE_OBJECT
      ? "Private photograph from the V&G archive"
      : "Original illustration of a sealed burgundy V&G envelope; personal photograph to follow");
  const [progress, proof] = await Promise.all([
    loadArchiveProgress(),
    readArchiveProof(),
  ]);
  return (
    <SpicyArchive
      archiveScenes={archiveScenes}
      investigationDocuments={investigationDocuments}
      privateOffer={privateCollection}
      imageAlt={imageAlt}
      initialStage={proof?.stage ?? "discovery"}
      progress={progress}
    />
  );
}
