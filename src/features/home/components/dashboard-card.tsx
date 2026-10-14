import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Sticker } from "@/components/design-system";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { StickerVariant } from "@/types/design-system";
import type { IconName } from "@/types/navigation";

type DashboardCardTone = "paper" | "taupe" | "ink" | "burgundy" | "sage";

const toneClassNames: Record<DashboardCardTone, string> = {
  paper:
    "border-[var(--line)] bg-[var(--paper-white)] text-[var(--ink)] hover:border-[var(--line-strong)]",
  taupe:
    "border-[var(--line)] bg-[#ded2c3] text-[var(--ink)] hover:border-[var(--line-strong)]",
  ink: "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-white)]",
  burgundy:
    "border-[var(--oxblood)] bg-[var(--oxblood)] text-[var(--paper-white)]",
  sage: "border-[#879b83] bg-[#dce5d5] text-[#273d31] hover:border-[#3e624d]",
};

interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  icon: IconName;
  index: string;
  tone?: DashboardCardTone;
  sticker?: StickerVariant;
  cta?: string;
}

export function DashboardCard({
  href,
  title,
  description,
  eyebrow,
  icon,
  index,
  tone = "paper",
  sticker,
  cta,
}: DashboardCardProps) {
  const isDark = tone === "ink" || tone === "burgundy";

  return (
    <Link
      className={cn(
        "group relative flex h-full min-h-[21rem] flex-col overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-paper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] sm:p-7",
        toneClassNames[tone],
      )}
      href={href}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute -top-24 -right-24 size-64 rounded-full opacity-0 blur-3xl transition duration-500 group-hover:opacity-100",
          isDark ? "bg-[var(--red-muted)]/35" : "bg-[var(--sand)]/55",
        )}
      />

      <div className="relative flex items-start justify-between gap-5">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full border",
            isDark ? "border-white/20" : "border-[var(--line-strong)]",
          )}
        >
          <Icon name={icon} size={20} />
        </span>
        <span className="font-mono text-[0.62rem] tracking-[0.15em] opacity-45">
          {index}
        </span>
      </div>

      {sticker ? (
        <span className="pointer-events-none absolute top-24 right-5 z-10 sm:right-8">
          <Sticker rotation={-2} size="sm" variant={sticker} />
        </span>
      ) : null}

      <div className="relative flex flex-1 flex-col pt-12">
        <p className="text-[0.58rem] font-bold tracking-[0.18em] uppercase opacity-55">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl leading-[0.98] tracking-[-0.045em] sm:text-4xl lg:min-h-[7.5rem]">
          {title}
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-6 opacity-60 lg:min-h-[4.5rem]">
          {description}
        </p>
        <span className="mt-auto inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-current/35 px-4 text-xs font-bold tracking-[.11em] uppercase">
          {cta ?? "Open file"}
          <ArrowUpRight
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            size={17}
            strokeWidth={1.6}
          />
        </span>
      </div>
    </Link>
  );
}
