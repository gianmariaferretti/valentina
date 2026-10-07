import { ArrowDownRight, CalendarDays, MapPin, Plane } from "lucide-react";
import type { Metadata } from "next";

import { Sticker } from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FeatureCard } from "@/components/ui/feature-card";
import { experienceSections } from "@/data/experience";

export const metadata: Metadata = {
  title: "Home",
};

const stats = [
  { label: "Officially since", value: "04 Oct 2025", icon: CalendarDays },
  { label: "Current season", value: "Year One", icon: Plane },
  { label: "Known coordinates", value: "04 places", icon: MapPin },
];

export default function HomePage() {
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-[2.25rem] bg-[var(--ink)] px-6 py-8 text-[var(--paper)] sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          <div className="absolute -top-32 -right-20 size-96 rounded-full bg-[var(--rust)] opacity-65 blur-2xl" />
          <div className="absolute top-7 right-7 z-10 hidden sm:block">
            <Sticker size="sm" variant="girlfriend-approved" />
          </div>
          <div className="relative grid min-h-[31rem] gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="self-center">
              <Eyebrow className="text-white/55">
                V&G private archive · issue one
              </Eyebrow>
              <h1 className="mt-6 max-w-5xl font-display text-[clamp(4.25rem,10vw,9.5rem)] leading-[0.8] tracking-[-0.065em]">
                The first
                <br />
                <span className="italic text-[var(--sand)]">365-ish.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                A year of airports, food theft, long calls and the surprisingly
                successful decision to choose each other.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <ArrowDownRight aria-hidden="true" className="mb-6" size={36} />
              <p className="max-w-xs font-display text-2xl leading-8 text-white/85">
                Begin anywhere. The story is not strictly chronological.
              </p>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section
          aria-label="Year One summary"
          className="grid border-x border-b border-[var(--line)] sm:grid-cols-3"
        >
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                className="flex items-center gap-4 border-b border-[var(--line)] px-5 py-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 sm:px-7"
                key={stat.label}
              >
                <StatIcon
                  aria-hidden="true"
                  className="text-[var(--rust)]"
                  size={19}
                  strokeWidth={1.6}
                />
                <div>
                  <p className="text-[0.58rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </section>
      </FadeIn>

      <section className="py-16 sm:py-20 lg:py-28">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Choose your own sentimental adventure</Eyebrow>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-6xl">
              Inside the archive.
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-[var(--muted)] md:block">
            Polished foundations now. The dangerous levels of personal detail
            arrive next.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {experienceSections.map((section) => (
            <FeatureCard key={section.id} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}
