import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <RouteScaffold
      description="A quiet, editorial home for photographs—not an infinite camera roll and definitely not a wedding slideshow."
      eyebrow="Selected evidence"
      icon="gallery"
      note="The responsive image grid is waiting for curated originals, captions and image metadata."
      title="Some moments deserve better than the camera roll."
    />
  );
}
