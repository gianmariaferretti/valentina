import type { Metadata } from "next";
import { SpicyArchive } from "@/features/secret/components/spicy-archive";

export const metadata: Metadata = {
  title: "The Spicy Archive",
  robots: { index: false, follow: false },
};

export default function SecretPage() {
  const imageAlt =
    process.env.SPICY_ARCHIVE_IMAGE_ALT ||
    (process.env.SPICY_ARCHIVE_OBJECT
      ? "Private photograph from the V&G archive"
      : "Original illustration of a sealed burgundy V&G envelope; personal photograph to follow");
  return <SpicyArchive imageAlt={imageAlt} />;
}
