import { ArrowRight } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { LinkButton } from "@/components/ui/button";
import { BoardingPass } from "@/features/cover/components/boarding-pass";
import { TogetherCounter } from "@/features/cover/components/together-counter";
import { TravelLines } from "@/features/cover/components/travel-lines";
import { CoverFluid } from "@/features/landing/fluid/cover-fluid";

/** Public cover. Nothing private here: city names and a day counter only. */
export default function EntryPage() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[var(--ink)] text-[var(--paper-white)]">
      <CoverFluid />
      <TravelLines />
      <div
        aria-hidden="true"
        className="absolute -top-[28rem] left-1/2 -z-10 size-[52rem] -translate-x-1/2 rounded-full bg-[var(--oxblood)]/45 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-6 bottom-6 border border-white/8 sm:inset-x-10 sm:top-10 sm:bottom-10"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[100rem] flex-col px-8 py-9 sm:px-14 sm:py-12 lg:px-20 lg:py-16">
        <FadeIn>
          <p className="font-display text-2xl tracking-[-0.04em] sm:text-3xl">
            V <span className="text-[var(--red-muted)]">+</span> G
          </p>
        </FadeIn>

        <div className="my-auto py-12 text-center">
          <FadeIn delay={0.08}>
            <p className="text-[0.6rem] font-semibold tracking-[0.38em] text-white/55 uppercase sm:text-[0.68rem]">
              Since 31.10.2025
            </p>
          </FadeIn>
          <FadeIn delay={0.14}>
            <h1 className="mt-6 font-display text-[clamp(3.35rem,17vw,13rem)] leading-[0.72] tracking-[-0.075em]">
              YEAR TWO
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <TogetherCounter />
          </FadeIn>
        </div>

        <FadeIn className="grid justify-items-center gap-5" delay={0.3}>
          <BoardingPass />
          <LinkButton className="min-w-36" href="/access" variant="light">
            Enter
            <ArrowRight aria-hidden="true" size={15} />
          </LinkButton>
        </FadeIn>
      </div>
    </main>
  );
}
