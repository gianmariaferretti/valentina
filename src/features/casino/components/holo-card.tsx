"use client";

/*
 * Holographic prize card.
 *
 * The pointer → CSS variable mapping (percent, background offset, rotation,
 * glare) is derived from "pokemon-cards-css" by Simon Goellner
 * (@simeydotme), https://github.com/simeydotme/pokemon-cards-css — GPL-3.0.
 * Only the interaction maths is adapted; no assets from that project are used.
 */

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import styles from "./holo-card.module.css";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);
const round = (value: number, precision = 3) =>
  parseFloat(value.toFixed(precision));
const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
) => round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

function apply(element: HTMLElement, percentX: number, percentY: number) {
  const x = clamp(percentX);
  const y = clamp(percentY);
  const centerX = x - 50;
  const centerY = y - 50;
  element.style.setProperty("--pointer-x", `${x}%`);
  element.style.setProperty("--pointer-y", `${y}%`);
  element.style.setProperty("--background-x", `${adjust(x, 0, 100, 37, 63)}%`);
  element.style.setProperty("--background-y", `${adjust(y, 0, 100, 33, 67)}%`);
  element.style.setProperty("--rotate-x", `${round(-(centerX / 3.5))}deg`);
  element.style.setProperty("--rotate-y", `${round(centerY / 2)}deg`);
  element.dataset.live = "true";
}

export function HoloCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;
    let frame = 0;
    const onPointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        apply(
          element,
          ((event.clientX - rect.left) / rect.width) * 100,
          ((event.clientY - rect.top) / rect.height) * 100,
        ),
      );
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        apply(
          element,
          ((event.gamma! + 30) / 60) * 100,
          ((event.beta! - 20) / 60) * 100,
        ),
      );
    };
    const onLeave = () => {
      element.dataset.live = "false";
      element.style.setProperty("--rotate-x", "0deg");
      element.style.setProperty("--rotate-y", "0deg");
    };
    element.addEventListener("pointermove", onPointer);
    element.addEventListener("pointerleave", onLeave);
    if (window.matchMedia("(hover: none)").matches)
      window.addEventListener("deviceorientation", onTilt);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", onPointer);
      element.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [reduced]);

  return (
    <div
      className={cn(styles.card, className)}
      data-live="false"
      ref={ref}
      style={glow ? ({ "--card-glow": glow } as CSSProperties) : undefined}
    >
      <div className={styles.rotator}>
        <div>{children}</div>
        <div aria-hidden="true" className={styles.shine} />
        <div aria-hidden="true" className={styles.glare} />
      </div>
    </div>
  );
}
