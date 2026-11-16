"use client";

import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { cn } from "@/lib/cn";

import { spinFortuneWheel, type CasinoActionResult } from "../actions";
import type { WheelEvent } from "../lib/engine";
import styles from "./casino.module.css";
import { pickQuip } from "./croupier";
import { connectionLost, type GameProps } from "./game-types";

const segments = casinoConfig.wheel.segments;
const SLICE = 360 / segments.length;
const colors = [
  "#b5172f",
  "#1d1d1d",
  "#0b7a43",
  "#7a1e4b",
  "#1d1d1d",
  "#c4122f",
];

function face(segment: (typeof segments)[number]) {
  if (segment.kind === "ticket") return { icon: "🎟️", text: "Coupon" };
  if (segment.amount > 0) return { icon: "💋", text: String(segment.amount) };
  return { icon: segment.label === "A hug" ? "🤗" : "😉", text: segment.label };
}

function slicePath(index: number): string {
  const start = ((index * SLICE - 90) * Math.PI) / 180;
  const end = (((index + 1) * SLICE - 90) * Math.PI) / 180;
  const r = 96;
  return `M 0 0 L ${r * Math.cos(start)} ${r * Math.sin(start)} A ${r} ${r} 0 0 1 ${
    r * Math.cos(end)
  } ${r * Math.sin(end)} Z`;
}

export function FortuneWheel({
  view,
  turbo,
  busy,
  sound,
  spend,
  onResult,
  setQuip,
}: GameProps) {
  const reduced = useReducedMotion() ?? false;
  const [spinning, setSpinning] = useState(false);
  const [event, setEvent] = useState<WheelEvent | null>(null);
  const rotation = useRef(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const counter = useRef(0);
  const free = view.freeWheel;
  const cost = free ? 0 : casinoConfig.wheel.cost;

  function animateTo(target: number, duration: number) {
    return new Promise<void>((resolve) => {
      const wheel = wheelRef.current;
      const pointer = pointerRef.current;
      const from = rotation.current;
      if (!wheel || duration === 0) {
        rotation.current = target;
        if (wheel) wheel.style.transform = `rotate(${target}deg)`;
        resolve();
        return;
      }
      const started = performance.now();
      let lastPeg = Math.floor(from / SLICE);
      let kick = 0;
      const frame = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        // Strong start, long realistic slowdown.
        const eased = 1 - (1 - t) ** 4;
        const angle = from + (target - from) * eased;
        wheel.style.transform = `rotate(${angle}deg)`;
        const peg = Math.floor(angle / SLICE);
        if (peg !== lastPeg) {
          lastPeg = peg;
          kick = 1;
          sound.play("tick");
        }
        kick = Math.max(0, kick - 0.18);
        if (pointer) pointer.style.transform = `rotate(${-24 * kick}deg)`;
        if (t < 1) requestAnimationFrame(frame);
        else {
          rotation.current = target;
          if (pointer) pointer.style.transform = "";
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  async function spin() {
    if (spinning || busy || view.balance < cost) return;
    setSpinning(true);
    setEvent(null);
    // On a phone the wheel may be scrolled under the HUD: bring it into view.
    if ((wheelRef.current?.getBoundingClientRect().top ?? 999) < 160)
      wheelRef.current?.scrollIntoView({
        block: "start",
        behavior: reduced ? "instant" : "smooth",
      });
    if (cost > 0) spend(cost);
    let result: CasinoActionResult;
    try {
      result = await spinFortuneWheel();
    } catch {
      result = connectionLost;
    }
    if (!result.ok || result.event.kind !== "wheel") {
      setSpinning(false);
      await onResult(result, null);
      return;
    }
    const wheel = result.event;
    const angle = (wheel.segment + wheel.offset) * SLICE;
    const current = rotation.current;
    const goal = (360 - angle) % 360;
    const delta = (goal - (current % 360) + 360) % 360;
    const turns = reduced ? 0 : turbo ? 3 : 6;
    await animateTo(
      current + turns * 360 + delta,
      reduced ? 0 : turbo ? 1400 : 3600,
    );
    counter.current += 1;
    setSpinning(false);
    setEvent(wheel);
    setQuip(
      pickQuip(
        wheel.coupons.length ? "coupon" : wheel.payout > 0 ? "win" : "lose",
        counter.current,
      ),
    );
    if (wheel.payout === 0 && wheel.coupons.length === 0) sound.play("lose");
    await onResult(result, wheelRef.current);
    button.current?.focus({ preventScroll: true });
  }

  const landed = event ? segments[event.segment] : null;

  return (
    <div>
      <div className={styles.wheelStage}>
        <svg
          aria-hidden="true"
          className={styles.wheelPointer}
          ref={pointerRef}
          viewBox="0 0 32 44"
        >
          <path
            d="M16 44 2 10a14 14 0 1 1 28 0z"
            fill="#ffd166"
            stroke="#5a3a00"
            strokeWidth="2"
          />
          <circle cx="16" cy="12" fill="#b5172f" r="5" />
        </svg>
        <svg
          aria-hidden="true"
          className={styles.wheelSvg}
          ref={wheelRef}
          viewBox="-104 -104 208 208"
        >
          <circle fill="#4a2a1a" r="104" />
          <circle fill="none" r="100" stroke="#c79a3b" strokeWidth="3" />
          {segments.map((segment, index) => {
            const mid = ((index + 0.5) * SLICE - 90) * (Math.PI / 180);
            const label = face(segment);
            const jackpot = index === 0;
            const fill = jackpot ? "#ffd166" : colors[index % colors.length];
            const ink = jackpot ? "#2a1400" : "#fff";
            return (
              <g key={index}>
                <path
                  d={slicePath(index)}
                  fill={fill}
                  stroke="#c79a3b"
                  strokeWidth="1"
                />
                <g
                  transform={`translate(${70 * Math.cos(mid)} ${70 * Math.sin(mid)}) rotate(${(index + 0.5) * SLICE})`}
                >
                  <text fontSize="15" textAnchor="middle" y="5">
                    {label.icon}
                  </text>
                </g>
                <g
                  transform={`translate(${47 * Math.cos(mid)} ${47 * Math.sin(mid)}) rotate(${(index + 0.5) * SLICE})`}
                >
                  <text
                    fill={ink}
                    fontSize={label.text.length > 4 ? 7.5 : 10}
                    fontWeight="900"
                    textAnchor="middle"
                    y="3"
                  >
                    {label.text}
                  </text>
                </g>
              </g>
            );
          })}
          {segments.map((_, index) => {
            const a = ((index * SLICE - 90) * Math.PI) / 180;
            return (
              <circle
                cx={96 * Math.cos(a)}
                cy={96 * Math.sin(a)}
                fill="#fff1b8"
                key={`peg-${index}`}
                r="3"
                stroke="#5a3a00"
                strokeWidth="1"
              />
            );
          })}
          <circle fill="#ffd166" r="14" stroke="#4a2a1a" strokeWidth="4" />
          <text fontSize="12" textAnchor="middle" y="4">
            💋
          </text>
        </svg>
      </div>
      <p
        aria-live="polite"
        className={styles.result}
        data-win={Boolean(event?.payout || event?.coupons.length)}
      >
        {landed && event
          ? event.coupons.length > 0
            ? `You won: ${event.coupons[0].title}`
            : event.payout > 0
              ? `WIN! +${event.payout} 💋`
              : event.nearMiss
                ? "So close… right next to 200 💋"
                : `${landed.label}. No win.`
          : ""}
      </p>
      <button
        className={styles.bigButton}
        disabled={spinning || busy || view.balance < cost}
        onClick={() => void spin()}
        ref={button}
        type="button"
      >
        {spinning
          ? "Spinning…"
          : free
            ? "Spin the wheel · FREE"
            : `Spin the wheel · ${cost} 💋`}
      </button>
      <p className={cn(styles.muted, "mt-2 text-center text-xs")}>
        One free spin per visit, at most every{" "}
        {casinoConfig.wheel.freeEveryHours} hours.
      </p>
    </div>
  );
}
