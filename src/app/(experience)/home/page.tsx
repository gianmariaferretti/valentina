import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";

import {
  DoodleArrow,
  HandwrittenNote,
  Sticker,
} from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { Eyebrow } from "@/components/ui/eyebrow";
import { DashboardCard } from "@/features/home/components/dashboard-card";

export const metadata: Metadata = {
  title: "Home",
};

const dashboardCards = [
  {
    href: "/coupons",
    title: "OUR COUPONS",
    description:
      "Promises, dates, useful favors and at least one suspiciously specific loophole.",
    eyebrow: "The main event",
    icon: "coupons" as const,
    index: "01 / 07",
    tone: "burgundy" as const,
    featured: true,
    sticker: "girlfriend-approved" as const,
  },
  {
    href: "/map",
    title: "OUR MAP",
    description: "The places that became ours, whether they agreed or not.",
    eyebrow: "Coordinates",
    icon: "map" as const,
    index: "02 / 07",
    tone: "paper" as const,
    sticker: "location" as const,
  },
  {
    href: "/open-when",
    title: "OPEN WHEN",
    description:
      "Emergency correspondence for very specific emotional weather.",
    eyebrow: "For later",
    icon: "open-when" as const,
    index: "03 / 07",
    tone: "ink" as const,
  },
  {
    href: "/challenges",
    title: "OUR GAMES",
    description:
      "Seven private operations involving memory, timing and avoidable pressure.",
    eyebrow: "Playable files",
    icon: "challenges" as const,
    index: "04 / 07",
    tone: "taupe" as const,
    sticker: "classified" as const,
  },
  {
    href: "/awards",
    title: "OUR AWARDS",
    description:
      "Recognition for excellence in snacks, patience and being right.",
    eyebrow: "Official-ish",
    icon: "awards" as const,
    index: "05 / 07",
    tone: "taupe" as const,
    sticker: "legendary" as const,
  },
  {
    href: "/quiz",
    title: "THE QUIZ",
    description: "A rigorous examination with emotionally binding results.",
    eyebrow: "No pressure",
    icon: "quiz" as const,
    index: "06 / 07",
    tone: "paper" as const,
  },
  {
    href: "/gallery",
    title: "OUR GALLERY",
    description:
      "Evidence that we went outside and occasionally looked composed.",
    eyebrow: "Selected evidence",
    icon: "gallery" as const,
    index: "07 / 07",
    tone: "ink" as const,
  },
] as const;

export default function HomePage() {
  return (
    <div className="page-container py-6 sm:py-10 lg:py-14">
      <FadeIn>
        <section className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] px-6 py-8 text-[var(--paper-white)] sm:px-10 sm:py-12 lg:min-h-[39rem] lg:px-16 lg:py-16">
          <div
            aria-hidden="true"
            className="absolute -top-52 -right-40 size-[38rem] rounded-full bg-[var(--oxblood)] opacity-75 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-8 bottom-7 font-display text-[12rem] leading-none tracking-[-0.09em] text-white/[0.035] sm:text-[18rem] lg:text-[27rem]"
          >
            365
          </div>

          <div className="relative flex min-h-[31rem] flex-col">
            <div className="flex items-start justify-between gap-4">
              <Eyebrow className="text-white/50">
                V + G · Private archive
              </Eyebrow>
              <Sticker
                className="hidden sm:inline-flex"
                rotation={3}
                size="sm"
                variant="girlfriend-approved"
              />
            </div>

            <div className="my-auto py-14">
              <h1 className="max-w-5xl font-display text-[clamp(3.25rem,12vw,10.5rem)] leading-[0.75] tracking-[-0.075em]">
                365 DAYS
                <br />
                <span className="ml-[0.22em] italic text-[var(--sand)]">
                  OF US
                </span>
              </h1>
            </div>

            <div className="flex flex-col gap-7 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-display text-2xl sm:text-3xl">
                  Valentina <span className="text-[var(--red-muted)]">&</span>{" "}
                  Gianmaria
                </p>
                <p className="mt-2 text-[0.62rem] font-semibold tracking-[0.18em] text-white/48 uppercase">
                  31.10.2025 → ∞
                </p>
              </div>
              <HandwrittenNote
                className="max-w-[16rem] text-left sm:text-right"
                rotation={-2}
                tone="paper"
              >
                one year down, an unreasonable number to go
              </HandwrittenNote>
            </div>
          </div>
        </section>
      </FadeIn>

      <section className="py-14 sm:py-20 lg:py-24">
        <FadeIn delay={0.08}>
          <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Choose your next discovery</Eyebrow>
              <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[0.94] tracking-[-0.045em] sm:text-6xl">
                The archive is yours.
              </h2>
            </div>
            <DoodleArrow
              className="hidden md:flex"
              direction="left"
              label="Start with the good stuff"
            />
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card, index) => (
            <FadeIn
              className={
                card.href === "/coupons"
                  ? "min-w-0 md:col-span-2 lg:row-span-2"
                  : "min-w-0"
              }
              delay={0.1 + index * 0.035}
              key={card.href}
            >
              <DashboardCard {...card} />
            </FadeIn>
          ))}

          <FadeIn className="min-w-0" delay={0.32}>
            <article className="flex min-h-64 flex-col rounded-[1.75rem] border border-dashed border-[var(--line-strong)] bg-transparent p-6 text-[var(--muted)] sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <span className="grid size-12 place-items-center rounded-full border border-dashed border-[var(--line-strong)]">
                  <LockKeyhole aria-hidden="true" size={19} strokeWidth={1.5} />
                </span>
                <span className="font-mono text-[0.62rem] tracking-[0.15em] opacity-55">
                  LOCKED
                </span>
              </div>
              <div className="mt-auto pt-14">
                <h2 className="font-display text-5xl tracking-[-0.045em]">
                  ???
                </h2>
                <p className="mt-4 text-sm leading-6">
                  You haven&apos;t unlocked this yet.
                </p>
              </div>
            </article>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
