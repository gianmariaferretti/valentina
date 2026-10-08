import { ArrowRight } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { LinkButton } from "@/components/ui/button";

export default function EntryPage() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[var(--ink)] text-[var(--paper-white)]">
      <div
        aria-hidden="true"
        className="absolute -top-[28rem] left-1/2 size-[52rem] -translate-x-1/2 rounded-full bg-[var(--oxblood)]/45 blur-[130px]"
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

        <div className="my-auto py-20 text-center">
          <FadeIn delay={0.08}>
            <p className="text-[0.6rem] font-semibold tracking-[0.38em] text-white/45 uppercase sm:text-[0.68rem]">
              31.10.2025 — 31.10.2026
            </p>
          </FadeIn>
          <FadeIn delay={0.14}>
            <h1 className="mt-6 font-display text-[clamp(3.35rem,17vw,13rem)] leading-[0.72] tracking-[-0.075em]">
              YEAR ONE
            </h1>
          </FadeIn>
          <FadeIn delay={0.22}>
            <p className="mx-auto mt-9 max-w-sm font-display text-xl leading-7 italic text-white/62 sm:text-2xl">
              A private place for two people.
            </p>
          </FadeIn>
        </div>

        <FadeIn className="flex justify-center sm:justify-end" delay={0.3}>
          <LinkButton className="min-w-36" href="/access" variant="light">
            Enter
            <ArrowRight aria-hidden="true" size={15} />
          </LinkButton>
        </FadeIn>
      </div>
    </main>
  );
}
