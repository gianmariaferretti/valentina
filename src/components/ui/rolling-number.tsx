"use client";

import NumberFlow, { type Format, NumberFlowGroup } from "@number-flow/react";
import { useEffect, useRef, useState } from "react";

/** Several numbers that change together (a countdown, "3 / 12") roll as one. */
export const RollingGroup = NumberFlowGroup;

const LOCALE = "en-US";

export interface RollingNumberProps {
  value: number;
  /** Intl options, e.g. `{ minimumIntegerDigits: 2 }` for clock digits. */
  format?: Format;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * Roll up from zero the first time the number comes into view. The real
   * value is in the server HTML, so nothing is lost without JavaScript.
   */
  rollIn?: boolean;
  /** Digits that wrap around (seconds: 59 → 00 rolls forward). */
  trend?: -1 | 0 | 1;
  /** For the hours/minutes/seconds digits of a countdown. */
  digits?: Record<number, { max: number }>;
}

/** What screen readers hear: the final value, never the rolling digits. */
export function spoken(
  value: number,
  format?: Format,
  prefix = "",
  suffix = "",
) {
  return `${prefix}${new Intl.NumberFormat(LOCALE, format).format(value)}${suffix}`;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A number whose digits roll to the new value (NumberFlow, MIT). English
 * formatting everywhere; instant with reduced motion (NumberFlow respects
 * the preference by itself).
 */
export function RollingNumber({
  value,
  format,
  prefix,
  suffix,
  className,
  rollIn = false,
  trend,
  digits,
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // server value → zero (not animated) → armed (animated, still zero) → live.
  const [phase, setPhase] = useState<"server" | "zero" | "armed" | "live">(
    rollIn ? "server" : "live",
  );

  useEffect(() => {
    if (phase !== "server") return;
    const host = ref.current;
    if (!host || reducedMotion() || !("IntersectionObserver" in window)) {
      const timer = window.setTimeout(() => setPhase("live"), 0);
      return () => window.clearTimeout(timer);
    }
    const reset = window.setTimeout(() => setPhase("zero"), 0);
    return () => window.clearTimeout(reset);
  }, [phase]);

  useEffect(() => {
    if (phase === "armed") {
      const timer = window.setTimeout(() => setPhase("live"), 60);
      return () => window.clearTimeout(timer);
    }
    if (phase !== "zero" || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setPhase("armed");
      },
      { threshold: 0.4 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [phase]);

  const current = phase === "live" || phase === "server" ? value : 0;
  return (
    <span className={className} ref={ref}>
      <NumberFlow
        aria-hidden="true"
        animated={phase === "armed" || phase === "live"}
        digits={digits}
        format={format}
        locales={LOCALE}
        prefix={prefix}
        suffix={suffix}
        trend={trend}
        value={current}
        willChange
      />
      <span className="sr-only">{spoken(value, format, prefix, suffix)}</span>
    </span>
  );
}

/** "+15 💋": rolls up from zero right after it appears (toasts). */
export function CountUp({
  value,
  prefix,
  suffix,
  className,
}: Pick<RollingNumberProps, "value" | "prefix" | "suffix" | "className">) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(value), 80);
    return () => window.clearTimeout(timer);
  }, [value]);
  return (
    <span className={className}>
      <NumberFlow
        aria-hidden="true"
        locales={LOCALE}
        prefix={prefix}
        suffix={suffix}
        value={shown}
      />
      <span className="sr-only">
        {spoken(value, undefined, prefix, suffix)}
      </span>
    </span>
  );
}
