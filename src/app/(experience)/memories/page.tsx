import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { Icon } from "@/components/ui/icon";
import { memoriesNavigation } from "@/data/navigation";
import { requireAccessSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Memories" };

const tones = [
  "bg-[var(--ink)] text-[var(--paper-white)] border-[var(--ink)]",
  "bg-[var(--paper-white)] border-[var(--line)]",
  "bg-[#ded2c3] border-[var(--line)]",
  "bg-[var(--oxblood)] text-[var(--paper-white)] border-[var(--oxblood)]",
  "bg-[#dce5d5] text-[#273d31] border-[#879b83]",
  "bg-[var(--paper-white)] border-[var(--line)]",
  "bg-[#ded2c3] border-[var(--line)]",
] as const;

/** The Memories tab: everything about places, photos, letters and next time. */
export default async function MemoriesPage() {
  await requireAccessSession();
  return (
    <div className="page-container py-6 sm:py-10">
      <FadeIn>
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Filed under: us
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5.5rem)] leading-[0.9] tracking-[-0.05em]">
          Memories
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
          Where we&apos;ve been, what we kept, and the plans we keep making
          anyway.
        </p>
      </FadeIn>
      <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {memoriesNavigation.map((item, index) => (
          <li
            className={cn(index === 0 && "col-span-2 lg:row-span-2")}
            key={item.href}
          >
            <FadeIn className="h-full" delay={0.03 * index}>
              <Link
                className={cn(
                  "flex h-full min-h-40 flex-col rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] motion-reduce:hover:translate-y-0 sm:p-5",
                  index === 0 && "min-h-52 lg:min-h-full",
                  tones[index % tones.length],
                )}
                href={item.href}
              >
                <span className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-full border border-current/25">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </span>
                <span className="mt-auto pt-6">
                  <span
                    className={cn(
                      "block font-display leading-none tracking-[-0.04em]",
                      index === 0 ? "text-5xl" : "text-2xl sm:text-3xl",
                    )}
                  >
                    {item.shortTitle}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 opacity-75">
                    {item.description}
                  </span>
                </span>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
    </div>
  );
}
