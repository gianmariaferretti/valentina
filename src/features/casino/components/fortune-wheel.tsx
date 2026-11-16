"use client";

import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { cn } from "@/lib/cn";

import type { CasinoActionResult } from "../actions";
import type { WheelEvent } from "../lib/engine";
import styles from "./casino.module.css";

const segments = casinoConfig.wheel.segments;
const SLICE = 360 / segments.length;
const colors = [
  "#ff3d9a",
  "#2a1f22",
  "#ffd166",
  "#7a1e4b",
  "#3a2a2e",
  "#ff7a59",
];

function slicePath(index: number): string {
  const start = ((index * SLICE - 90) * Math.PI) / 180;
  const end = (((index + 1) * SLICE - 90) * Math.PI) / 180;
  const r = 100;
  return `M 0 0 L ${r * Math.cos(start)} ${r * Math.sin(start)} A ${r} ${r} 0 0 1 ${
    r * Math.cos(end)
  } ${r * Math.sin(end)} Z`;
}

interface FortuneWheelProps {
  balance: number;
  free: boolean;
  turbo: boolean;
  disabled: boolean;
  onSpin: () => Promise<CasinoActionResult>;
  onSettled: (result: CasinoActionResult) => void;
}

export function FortuneWheel({
  balance,
  free,
  turbo,
  disabled,
  onSpin,
  onSettled,
}: FortuneWheelProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [event, setEvent] = useState<WheelEvent | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const cost = free ? 0 : casinoConfig.wheel.cost;
  const duration = reducedMotion ? 0 : turbo ? 900 : 2000;

  async function spin() {
    if (spinning || disabled || balance < cost) return;
    setSpinning(true);
    setEvent(null);
    let result: CasinoActionResult;
    try {
      result = await onSpin();
    } catch {
      result = {
        ok: false,
        message: "The connection dropped. Nothing was charged — try again.",
      };
    }
    if (!result.ok || result.event.kind !== "wheel") {
      setSpinning(false);
      onSettled(result);
      return;
    }
    const wheel = result.event;
    const angle = (wheel.segment + wheel.offset) * SLICE;
    setRotation((current) => {
      const target = (360 - angle) % 360;
      const delta = (target - (current % 360) + 360) % 360;
      return current + (reducedMotion ? 0 : 360 * 5) + delta;
    });
    window.setTimeout(() => {
      setSpinning(false);
      setEvent(wheel);
      onSettled(result);
      button.current?.focus({ preventScroll: true });
    }, duration + 80);
  }

  const landed = event ? segments[event.segment] : null;

  return (
    <div>
      <div className={styles.wheelWrap}>
        <span aria-hidden="true" className={styles.pointer} />
        <svg
          aria-hidden="true"
          className={styles.wheel}
          style={{
            transform: `rotate(${rotation}deg)`,
            ["--spin-ms" as string]: `${duration}ms`,
          }}
          viewBox="-104 -104 208 208"
        >
          <circle fill="#120c0e" r="104" />
          {segments.map((segment, index) => {
            const mid = ((index + 0.5) * SLICE - 90) * (Math.PI / 180);
            return (
              <g key={index}>
                <path
                  d={slicePath(index)}
                  fill={index === 0 ? "#fff3b0" : colors[index % colors.length]}
                  stroke="#120c0e"
                  strokeWidth="1.5"
                />
                <text
                  fill={
                    index === 0 || index % colors.length === 2
                      ? "#2a1400"
                      : "#fff"
                  }
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                  transform={`translate(${66 * Math.cos(mid)} ${66 * Math.sin(mid)}) rotate(${
                    (index + 0.5) * SLICE
                  })`}
                >
                  {segment.label}
                </text>
              </g>
            );
          })}
          <circle fill="#ffd166" r="12" stroke="#120c0e" strokeWidth="3" />
        </svg>
      </div>
      <p
        aria-live="polite"
        className={styles.result}
        data-win={(event?.payout ?? 0) > 0}
      >
        {landed
          ? event && event.coupons.length > 0
            ? "TICKET! A coupon is yours."
            : event && event.payout > 0
              ? `WIN! +${event.payout} 💋`
              : event?.nearMiss
                ? "Right next to the jackpot. Tragic."
                : `${landed.label}. Gianmaria is delighted.`
          : ""}
      </p>
      <button
        className={cn(styles.bigButton, "mt-3")}
        disabled={spinning || disabled || balance < cost}
        onClick={() => void spin()}
        ref={button}
        type="button"
      >
        {spinning
          ? "Spinning…"
          : free
            ? "Free spin!"
            : `Spin again · ${cost} 💋`}
      </button>
      <p className={cn(styles.muted, "mt-2 text-center text-xs")}>
        One free spin per visit, at most every{" "}
        {casinoConfig.wheel.freeEveryHours} hours.
      </p>
    </div>
  );
}
