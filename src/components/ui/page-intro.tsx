import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
}: PageIntroProps) {
  return (
    <header className="grid gap-8 border-b border-[var(--line)] pb-10 md:grid-cols-[minmax(0,1fr)_minmax(16rem,26rem)] md:items-end md:pb-14">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.94] tracking-[-0.045em] text-balance sm:text-6xl lg:text-8xl">
          {title}
        </h1>
      </div>
      <div className="md:pb-1">
        <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          {description}
        </p>
        {aside}
      </div>
    </header>
  );
}
