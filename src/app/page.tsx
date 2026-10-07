import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { FadeIn } from "@/components/motion/fade-in";
import { LinkButton } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function EntryPage() {
  return (
    <main className="min-h-svh p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[100rem] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/25 lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)] sm:min-h-[calc(100svh-2.5rem)]">
        <section className="flex min-h-[44rem] flex-col p-7 sm:p-12 lg:p-16 xl:p-20">
          <FadeIn>
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl tracking-[-0.04em]">
                V<span className="text-[var(--rust)]">&</span>G
              </p>
              <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
                Private edition · 01
              </p>
            </div>
          </FadeIn>

          <FadeIn className="my-auto py-16" delay={0.08}>
            <Eyebrow>One year, properly archived</Eyebrow>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(4rem,10vw,9rem)] leading-[0.78] tracking-[-0.065em]">
              Year
              <br />
              <span className="ml-[0.52em] italic text-[var(--rust)]">
                One.
              </span>
            </h1>
            <p className="mt-9 max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              A private digital archive of flights, photographs, excellent
              decisions and a few events both parties remember differently.
            </p>
            <LinkButton className="mt-8" href="/access">
              Knock properly
              <ArrowRight aria-hidden="true" size={15} />
            </LinkButton>
          </FadeIn>

          <FadeIn delay={0.16}>
            <div className="flex items-end justify-between gap-6 border-t border-[var(--line)] pt-5 text-[0.62rem] tracking-[0.16em] text-[var(--muted)] uppercase">
              <span>04.10.2025 — 04.10.2026</span>
              <span className="text-right">For Valentina, obviously</span>
            </div>
          </FadeIn>
        </section>

        <FadeIn className="relative min-h-[38rem] overflow-hidden" delay={0.12}>
          <Image
            alt="Abstract Year One artwork in oxblood, ink and parchment"
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            src="/images/year-one-cover.svg"
          />
          <div className="absolute top-6 right-6 rounded-full border border-white/25 bg-black/10 px-4 py-2 text-[0.6rem] tracking-[0.16em] text-white/75 uppercase backdrop-blur-md">
            Not for public consumption
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
