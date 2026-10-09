import { CalendarDays, Scale, Sparkles, Trophy } from "lucide-react";
import type { Metadata } from "next";

import { Sticker } from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { awards } from "@/data/awards";
import { AwardRevealCard } from "@/features/awards/components/award-reveal-card";

import styles from "@/features/awards/components/awards.module.css";

export const metadata: Metadata = {
  title: "The V&G Awards",
  description:
    "Celebrating excellence, chaos and questionable decisions from Year One.",
};

export default function AwardsPage() {
  return (
    <div className={`page-container ${styles.page}`}>
      <FadeIn>
        <header className={styles.hero}>
          <div className={styles.heroTopline}>
            <p>V + G · Inaugural ceremony</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Sticker
                className="hidden sm:inline-flex"
                rotation={2}
                size="sm"
                text="Official jury"
                variant="jury"
              />
              <Sticker
                rotation={-3}
                size="sm"
                text="Results classified"
                variant="classified"
              />
            </div>
          </div>

          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>2025 — 2026</p>
            <h1>
              The V&amp;G
              <em>Awards</em>
            </h1>
            <p className={styles.heroSubtitle}>
              “Celebrating excellence, chaos and questionable decisions.”
            </p>
          </div>

          <div className={styles.heroSeal} aria-hidden="true">
            V&amp;G
            <small>Jury certified</small>
          </div>

          <div className={styles.heroFooter}>
            <div>
              <Trophy aria-hidden="true" size={20} strokeWidth={1.35} />
              <p>
                <strong>{awards.length} categories</strong>
                <span>Glory varies by category</span>
              </p>
            </div>
            <div>
              <Scale aria-hidden="true" size={20} strokeWidth={1.35} />
              <p>
                <strong>One biased jury</strong>
                <span>Independent review unavailable</span>
              </p>
            </div>
            <div>
              <CalendarDays aria-hidden="true" size={20} strokeWidth={1.35} />
              <p>
                <strong>Year One</strong>
                <span>All decisions emotionally binding</span>
              </p>
            </div>
          </div>
        </header>
      </FadeIn>

      <section aria-labelledby="ceremony-program">
        <FadeIn delay={0.08}>
          <div className={styles.programHeader}>
            <div>
              <p className={styles.programEyebrow}>The official programme</p>
              <h2 id="ceremony-program">
                {awards.length} envelopes. No appeals.
              </h2>
            </div>
            <p>
              Open a category to inspect the nominees. The winner remains sealed
              until you request the verdict—because even a fixed awards ceremony
              needs suspense.
            </p>
          </div>
        </FadeIn>

        <div className={styles.program}>
          {awards.map((award, index) => (
            <AwardRevealCard
              award={award}
              index={index}
              total={awards.length}
              key={award.id}
            />
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <Sparkles aria-hidden="true" className="mx-auto text-[#d8b557]" />
        <p>End of ceremony</p>
        <h2>Thank you to the winners, the losers and the legal department.</h2>
        <p>
          Results are final unless Valentina submits a sufficiently persuasive
          objection. In that case, the jury will suddenly remember who the MVP
          is.
        </p>
      </section>
    </div>
  );
}
