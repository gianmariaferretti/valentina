import type { Metadata } from "next";

import {
  DoodleArrow,
  HandwrittenNote,
  PaperCard,
  Sticker,
  Tape,
} from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";

export const metadata: Metadata = { title: "Secret" };

export default function SecretPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        description="A route hidden in plain sight, reserved for the experience’s least predictable idea."
        eyebrow="Nothing to see here"
        title="This is definitely not the secret."
      />
      <PaperCard
        className="mt-8 grid min-h-[34rem] place-items-center p-8 text-center sm:mt-12"
        elevated
        tone="ink"
      >
        <Tape position="top" rotation={-3} tone="burgundy" />
        <div className="absolute top-6 right-6">
          <Sticker size="sm" variant="top-secret" />
        </div>
        <div className="max-w-xl">
          <Sticker rotation={4} size="lg" variant="do-not-open" />
          <h2 className="mt-10 font-display text-5xl tracking-[-0.045em] text-[var(--paper)] sm:text-7xl">
            Classified for excellent reasons.
          </h2>
          <HandwrittenNote className="mt-8 block" rotation={-2} tone="paper">
            asking again will not improve your clearance level
          </HandwrittenNote>
          <DoodleArrow
            className="mt-10"
            label="suspiciously empty"
            tone="sand"
          />
        </div>
      </PaperCard>
    </div>
  );
}
