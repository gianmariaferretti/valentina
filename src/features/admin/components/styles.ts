import { cn } from "@/lib/cn";

/** Plain class helpers, usable from server and client components. */
export type Tone = "primary" | "ghost" | "danger";

const toneClass: Record<Tone, string> = {
  primary:
    "bg-[var(--ink)] text-[var(--paper-white)] hover:bg-[var(--ink-soft)]",
  ghost:
    "border border-[var(--line-strong)] bg-white/70 text-[var(--ink)] hover:bg-white",
  danger: "bg-[#b3261e] text-white hover:bg-[#93201a]",
};

export function buttonClass(tone: Tone = "ghost", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50",
    toneClass[tone],
    className,
  );
}

export const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--ink)]";
