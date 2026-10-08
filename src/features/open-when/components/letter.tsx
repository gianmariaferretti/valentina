import { Heart, PenLine } from "lucide-react";

import { HandwrittenNote, Tape } from "@/components/design-system";
import type { OpenWhenLetter } from "@/features/open-when/types";

interface LetterProps {
  readonly letter: OpenWhenLetter;
  readonly sequence: number;
}

export function Letter({ letter, sequence }: LetterProps) {
  return (
    <article className="letter" data-mood={letter.mood}>
      <Tape
        className="letter__tape letter__tape--left"
        position="inline"
        rotation={-7}
        size="md"
        tone="cream"
      />
      <Tape
        className="letter__tape letter__tape--right"
        position="inline"
        rotation={6}
        size="sm"
        tone={letter.mood === "playful" ? "rose" : "clear"}
      />

      <header className="letter__heading">
        <div>
          <p>V + G · Private correspondence</p>
          <span>Letter {String(sequence + 1).padStart(2, "0")} / 11</span>
        </div>
        <Heart aria-hidden="true" size={17} strokeWidth={1.35} />
      </header>

      <div className="letter__body">
        <HandwrittenNote
          className="letter__annotation"
          rotation={-3}
          tone="burgundy"
        >
          {letter.annotation}
        </HandwrittenNote>
        <p className="letter__salutation">{letter.salutation}</p>
        <div className="letter__paragraphs">
          {letter.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="letter__signoff">{letter.signoff}</p>
        {letter.postscript ? (
          <p className="letter__postscript">
            <strong>P.S.</strong> {letter.postscript}
          </p>
        ) : null}
      </div>

      <footer className="letter__footer">
        <span>
          <PenLine aria-hidden="true" size={13} /> Written for Valentina
        </span>
        <span>31.10.2025 → ∞</span>
      </footer>
    </article>
  );
}
