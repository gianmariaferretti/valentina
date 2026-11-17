import Link from "next/link";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        href="/admin"
      >
        ← Scrivania
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl leading-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--line)] bg-[var(--paper-white)] p-4 shadow-[0_8px_24px_rgba(49,35,30,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "bg-[var(--paper-deep)] text-[var(--ink)]",
    good: "bg-[#dbeccf] text-[#2f5d1f]",
    warn: "bg-[#fde7c4] text-[#7a4b00]",
    bad: "bg-[#f8d7d3] text-[#8a1c14]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const rome = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : rome.format(date);
}

export function Unavailable() {
  return (
    <Card>
      <p className="text-sm">
        Non riesco a leggere i dati in questo momento (Supabase non risponde).
        Riprova tra poco.
      </p>
    </Card>
  );
}
