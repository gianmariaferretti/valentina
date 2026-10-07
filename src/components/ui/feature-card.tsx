import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { ExperienceSection } from "@/types/content";

const toneClassNames = {
  ink: "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]",
  paper: "border-[var(--line)] bg-white/45 text-[var(--ink)]",
  rust: "border-[var(--rust)] bg-[var(--rust)] text-white",
} as const;

export function FeatureCard({ section }: { section: ExperienceSection }) {
  const isDark = section.tone !== "paper";

  return (
    <Link
      className={cn(
        "group relative flex min-h-72 flex-col overflow-hidden rounded-[2rem] border p-6 transition duration-500 hover:-translate-y-1 sm:p-8",
        toneClassNames[section.tone],
      )}
      href={section.href}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs tracking-[0.18em]",
            isDark ? "text-white/55" : "text-[var(--muted)]",
          )}
        >
          {section.index}
        </span>
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full border transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105",
            isDark ? "border-white/20" : "border-[var(--line)]",
          )}
        >
          <Icon name={section.icon} />
        </span>
      </div>
      <div className="mt-auto pt-16">
        <p
          className={cn(
            "text-[0.62rem] font-semibold tracking-[0.18em] uppercase",
            isDark ? "text-white/55" : "text-[var(--muted)]",
          )}
        >
          {section.eyebrow}
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl tracking-[-0.035em]">
              {section.title}
            </h2>
            <p
              className={cn(
                "mt-3 max-w-sm text-sm leading-6",
                isDark ? "text-white/65" : "text-[var(--muted)]",
              )}
            >
              {section.description}
            </p>
          </div>
          <Icon
            className="mb-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            name="arrow"
            size={22}
          />
        </div>
      </div>
    </Link>
  );
}
