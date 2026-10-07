import { MailOpen, PenLine, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import {
  DoodleArrow,
  HandwrittenNote,
  Sticker,
  Tape,
} from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { openWhenLetters } from "@/data/open-when";
import { Envelope } from "@/features/open-when/components/envelope";
import { loadOpenWhenState } from "@/features/open-when/repositories/get-open-when-state-repository";

export const metadata: Metadata = {
  title: "Open when",
  description: "Eleven private letters for very specific emotional weather.",
};

export default async function OpenWhenPage() {
  const state = await loadOpenWhenState();
  const openedSlugs = new Set(state.openedLetters.map((letter) => letter.slug));
  const openedCount = openWhenLetters.filter((letter) =>
    openedSlugs.has(letter.slug),
  ).length;

  return (
    <div className="page-container py-6 sm:py-10 lg:py-14">
      <FadeIn>
        <header className="open-when-header">
          <div className="open-when-header__topline">
            <p>V + G · Emergency correspondence</p>
            <Sticker
              className="hidden sm:inline-flex"
              rotation={3}
              size="sm"
              text="For Valentina only"
              variant="classified"
            />
          </div>

          <div className="open-when-header__body">
            <div>
              <p className="open-when-header__eyebrow">
                Eleven notes for later
              </p>
              <h1>
                Open
                <br />
                <em>when…</em>
              </h1>
              <p className="open-when-header__description">
                A small emergency kit for specific emotional weather. Some
                sincerity, some damage control, and at least one envelope with
                suspicious intentions.
              </p>
            </div>

            <div className="open-when-progress">
              <div>
                <MailOpen aria-hidden="true" size={22} strokeWidth={1.4} />
                <p>
                  <strong>{openedCount}</strong>
                  <span>/ {openWhenLetters.length} opened</span>
                </p>
              </div>
              <progress
                aria-label={`${openedCount} of ${openWhenLetters.length} envelopes opened`}
                max={openWhenLetters.length}
                value={openedCount}
              />
              <p>
                {openWhenLetters.length - openedCount} still waiting for you
              </p>
            </div>
          </div>

          <HandwrittenNote
            className="open-when-header__note"
            rotation={-4}
            tone="paper"
          >
            no particular order. emotional emergencies ignore filing systems.
          </HandwrittenNote>
        </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section className="open-when-desk" aria-labelledby="letter-collection">
          <Tape
            className="open-when-desk__tape"
            position="inline"
            rotation={-8}
            size="lg"
            tone="cream"
          />
          <div className="open-when-desk__label">
            <PenLine aria-hidden="true" size={16} />
            <div>
              <p id="letter-collection">Filed for future use</p>
              <span>Tap an envelope to inspect the contents</span>
            </div>
          </div>
          <DoodleArrow
            className="open-when-desk__arrow"
            direction="down"
            label="choose carefully"
          />

          <ol className="open-when-scatter">
            {openWhenLetters.map((letter, index) => (
              <li key={letter.slug}>
                <Envelope
                  href={`/open-when/${letter.slug}`}
                  index={index}
                  letter={letter}
                  opened={openedSlugs.has(letter.slug)}
                />
              </li>
            ))}
          </ol>

          <div className="open-when-desk__footer">
            <span>
              <ShieldCheck aria-hidden="true" size={15} /> Private archive
            </span>
            <span>Contents may contain feelings</span>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
