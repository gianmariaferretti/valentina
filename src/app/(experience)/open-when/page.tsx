import { ArrowUpRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { openWhenLetters } from "@/data/open-when";

export const metadata: Metadata = {
  title: "Open when",
};

export default function OpenWhenPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        description="A tiny emergency kit for very specific situations. No essays. Mostly love, occasionally damage control."
        eyebrow="Filed for future use"
        title="Open when you need the right note."
      />
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 sm:mt-12">
        {openWhenLetters.map((letter, index) => (
          <Link
            className="group flex min-h-72 flex-col rounded-[1.75rem] border border-[var(--line)] bg-white/35 p-6 transition duration-500 hover:-translate-y-1 hover:bg-white/50 sm:p-8"
            href={`/open-when/${letter.slug}`}
            key={letter.slug}
          >
            <div className="flex items-center justify-between text-[var(--muted)]">
              <Mail aria-hidden="true" size={19} strokeWidth={1.5} />
              <span className="font-mono text-[0.65rem]">0{index + 1}</span>
            </div>
            <div className="mt-auto pt-16">
              <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-[var(--rust)] uppercase">
                Open when
              </p>
              <h2 className="mt-3 font-display text-4xl leading-none tracking-[-0.035em]">
                {letter.title}.
              </h2>
              <div className="mt-5 flex items-end justify-between gap-6">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {letter.preview}
                </p>
                <ArrowUpRight
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  size={18}
                />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
