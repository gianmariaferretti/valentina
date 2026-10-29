import { ArrowUpRight, BookOpen, Clock3, Languages } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Italian Corner",
  description: "One Italian examination and La Dolce Lingua.",
};

const experiences = [
  {
    href: "/italian-corner/challenge",
    number: "01",
    title: "The Italian Challenge",
    subtitle: "Are You Italian Enough?",
    detail: "15 questions · A2–B1 · 10 minutes · 3 attempts",
    Icon: Languages,
  },
  {
    href: "/la-dolce-lingua",
    number: "02",
    title: "La Dolce Lingua",
    subtitle: "An Italian Course Made with Love",
    detail: "A2 · B1 · B2 · lessons coming from Gianmaria",
    Icon: BookOpen,
  },
] as const;

export default function ItalianCornerPage() {
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <header className="relative overflow-hidden rounded-[2rem] bg-[var(--oxblood)] px-6 py-10 text-[var(--paper-white)] sm:px-10 sm:py-14 lg:px-16 lg:py-20">
        <span
          aria-hidden="true"
          className="absolute -right-9 -bottom-20 font-display text-[18rem] leading-none tracking-[-0.1em] text-white/[0.045]"
        >
          IT
        </span>
        <p className="relative text-[0.62rem] font-bold tracking-[0.24em] text-white/65 uppercase">
          V + G · Private language department
        </p>
        <h1 className="relative mt-8 max-w-4xl font-display text-[clamp(4rem,11vw,10rem)] leading-[0.82] tracking-[-0.065em]">
          Italian
          <br />
          <em>Corner.</em>
        </h1>
        <p className="relative mt-8 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
          One examination. One language academy. A very small, entirely
          unofficial embassy of us.
        </p>
        <span className="relative mt-10 inline-flex items-center gap-2 border-t border-white/20 pt-5 text-[0.62rem] font-semibold tracking-[0.18em] text-white/55 uppercase">
          <Clock3 size={14} /> Open for study and mild judgment
        </span>
      </header>
      <section
        aria-label="Italian Corner experiences"
        className="mt-7 grid gap-5 lg:grid-cols-2"
      >
        {experiences.map(
          ({ href, number, title, subtitle, detail, Icon }, index) => (
            <Link
              className={`group flex min-h-80 flex-col rounded-[1.75rem] border border-[var(--line)] p-6 shadow-[var(--shadow-paper)] transition-transform hover:-translate-y-1 motion-reduce:transform-none sm:p-8 ${index === 0 ? "bg-[var(--paper-white)]" : "bg-[var(--ink)] text-[var(--paper-white)]"}`}
              href={href}
              key={href}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs opacity-50">
                  {number} / 02
                </span>
                <Icon aria-hidden="true" size={25} strokeWidth={1.4} />
              </div>
              <div className="mt-auto">
                <p className="text-[0.62rem] font-bold tracking-[0.16em] opacity-60 uppercase">
                  {subtitle}
                </p>
                <h2 className="mt-3 font-display text-[clamp(2.4rem,4vw,3.5rem)] leading-[0.95] tracking-[-0.04em]">
                  {title}
                </h2>
                <p className="mt-5 text-xs leading-6 opacity-65">{detail}</p>
                <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-[0.62rem] font-bold tracking-[0.14em] uppercase">
                  Open file <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ),
        )}
      </section>
    </div>
  );
}
