import type { Metadata } from "next";

import {
  HandwrittenNote,
  PaperCard,
  Polaroid,
  Sticker,
} from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        description="A quiet, editorial home for photographs—not an infinite camera roll and definitely not a wedding slideshow."
        eyebrow="Selected evidence"
        title="Some moments deserve better than the camera roll."
      />
      <PaperCard
        className="mt-8 min-h-[42rem] p-7 sm:mt-12 sm:p-12 lg:p-16"
        texture="grid"
        tone="taupe"
      >
        <div className="absolute top-6 right-6 z-10">
          <Sticker size="sm" variant="girlfriend-approved" />
        </div>
        <div className="grid items-center gap-12 pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="justify-self-center lg:col-span-4 lg:justify-self-start">
            <Polaroid
              caption="First selected memory"
              label="Frame 01"
              rotation={-4}
              taped
            />
          </div>
          <div className="justify-self-center lg:col-span-4 lg:-translate-y-8">
            <Polaroid
              caption="A place worth returning to"
              label="Frame 02"
              orientation="square"
              rotation={3}
            />
          </div>
          <div className="justify-self-center sm:col-span-2 lg:col-span-4 lg:justify-self-end">
            <Polaroid
              caption="Evidence, pending"
              label="Frame 03"
              orientation="landscape"
              rotation={-2}
              taped
            />
          </div>
        </div>
        <div className="mt-16 flex justify-center">
          <HandwrittenNote rotation={-2} tone="ink">
            Real photographs will be curated here—no filler, no stock couples.
          </HandwrittenNote>
        </div>
      </PaperCard>
    </div>
  );
}
