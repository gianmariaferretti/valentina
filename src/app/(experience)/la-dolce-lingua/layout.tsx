import type { ReactNode } from "react";
import Link from "next/link";

import "./academy.css";
import "./world.css";

export default function DolceLinguaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="academy-surface min-h-svh pb-16 text-[#272b22]">
      <nav
        aria-label="Navigazione La Dolce Lingua"
        className="academy-nav border-b border-[#425947]/20 bg-[#f3efe4]/90 px-4 py-3 backdrop-blur sm:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase"
            href="/home"
          >
            ← V&G Home
          </Link>
          <Link
            className="font-display text-xl italic text-[#355244]"
            href="/la-dolce-lingua"
          >
            La Dolce Lingua
          </Link>
          <Link
            className="inline-flex min-h-11 items-center text-xs font-semibold tracking-[0.12em] uppercase"
            href="/la-dolce-lingua#curriculum"
          >
            Curriculum ↗
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
