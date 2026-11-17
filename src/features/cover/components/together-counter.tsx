"use client";

import { useEffect, useState } from "react";

import { togetherAt } from "../lib/together";

const pad = (value: number) => String(value).padStart(2, "0");

/** Live count of the time together since 31.10.2025. */
export function TogetherCounter() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const t = now === null ? null : togetherAt(now);
  return (
    <p className="mt-7 font-mono text-xs tracking-[0.18em] text-white/70 uppercase sm:text-sm">
      <span className="sr-only">Together for </span>
      <span className="font-display text-3xl tracking-[-0.02em] text-[var(--paper-white)] normal-case tabular-nums sm:text-4xl">
        {t ? t.days : "···"}
      </span>{" "}
      days together
      <span
        aria-hidden="true"
        className="mt-1 block tabular-nums text-white/55"
      >
        {t ? `${pad(t.hours)}h ${pad(t.minutes)}m ${pad(t.seconds)}s` : " "}
      </span>
    </p>
  );
}
