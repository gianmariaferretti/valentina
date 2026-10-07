import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Sticker } from "@/components/design-system";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { StickerVariant } from "@/types/design-system";
import type { IconName } from "@/types/navigation";

type DashboardCardTone = "paper" | "taupe" | "ink" | "burgundy";

const toneClassNames: Record<DashboardCardTone, string> = {
  paper:
    "border-[var(--line)] bg-[var(--paper-white)] text-[var(--ink)] hover:border-[var(--line-strong)]",
  taupe:
    "border-[var(--line)] bg-[#ded2c3] text-[var(--ink)] hover:border-[var(--line-strong)]",
  ink: "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-white)]",
  burgundy:
    "border-[var(--oxblood)] bg-[var(--oxblood)] text-[var(--paper-white)]",
};

interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  icon: IconName;
  index: string;
  tone?: DashboardCardTone;
  featured?: boolean;
  sticker?: StickerVariant;
}

export function DashboardCard({
  href,
  title,
  description,
  eyebrow,
  icon,
  index,
  tone = "paper",
  featured = false,
  sticker,
}: DashboardCardProps) {
  const isDark = tone === "ink" || tone === "burgundy";

  return (
    <Link
      className={cn(
        "group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-paper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] sm:p-7",
        toneClassNames[tone],
        featured &&
          "min-h-[31rem] md:col-span-2 lg:row-span-2 lg:min-h-[38rem] lg:p-10",
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
        <Sticker
          className="absolute top-24 right-5 sm:right-8"
          rotation={featured ? 3 : -2}
          size="sm"
          variant={sticker}
        />
      ) : null}

      <div className="relative mt-auto pt-14">
        <p className="text-[0.58rem] font-bold tracking-[0.18em] uppercase opacity-55">
          {eyebrow}
        </p>
        <div className="mt-3 flex items-end justify-between gap-6">
          <h2
            className={cn(
              "max-w-xl font-display leading-[0.9] tracking-[-0.045em]",
              featured ? "text-5xl sm:text-7xl lg:text-8xl" : "text-4xl",
            )}
          >
            {title}
          </h2>
          <ArrowUpRight
            aria-hidden="true"
            className="mb-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            size={featured ? 30 : 24}
            strokeWidth={1.4}
          />
        </div>
        <p
          className={cn(
            "mt-5 max-w-lg text-sm leading-6 opacity-60",
            featured && "sm:text-base sm:leading-7",
          )}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
