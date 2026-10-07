import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = { title: "Year Two" };

export default function YearTwoPage() {
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <section className="relative grid min-h-[calc(100svh-12rem)] overflow-hidden rounded-[2.25rem] bg-[var(--rust)] p-7 text-white sm:p-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-16">
        <div className="absolute -right-32 -bottom-48 size-[34rem] rounded-full border-[7rem] border-white/5" />
        <div className="relative flex flex-col">
          <Eyebrow className="text-white/55">Next season</Eyebrow>
          <h1 className="my-auto py-20 font-display text-[clamp(5rem,14vw,13rem)] leading-[0.75] tracking-[-0.07em]">
            Year
            <br />
            <span className="italic text-[var(--paper)]">Two.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-white/65 sm:text-lg">
            More places. More photographs. More extremely mature disagreements.
            More us.
          </p>
        </div>
        <aside className="relative mt-12 flex flex-col justify-between border-t border-white/20 pt-8 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <ArrowUpRight aria-hidden="true" size={32} />
          <div className="mt-24">
            <p className="font-display text-3xl leading-tight">
              Renewal status:
              <br />
              enthusiastically approved.
            </p>
            <p className="mt-4 text-xs tracking-[0.13em] text-white/50 uppercase">
              No cancellation policy
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
