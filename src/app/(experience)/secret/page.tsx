import type { Metadata } from "next";
import { SpicyArchive } from "@/features/secret/components/spicy-archive";
import { loadArchiveProgress } from "@/features/secret/actions/archive-actions";
import { readArchiveProof } from "@/features/secret/lib/archive-session";

export const metadata: Metadata = {
  title: "The Spicy Archive",
  robots: { index: false, follow: false },
};

export default async function SecretPage() {
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
      imageAlt={imageAlt}
      initialStage={proof?.stage ?? "discovery"}
      progress={progress}
    />
  );
}
