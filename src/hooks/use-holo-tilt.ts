"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, type RefObject } from "react";

/**
 * Drives `--px`/`--py` (0–100%) on an element from the pointer or, on phones,
 * from device tilt. Sets `data-live="true"` once real input arrives; until
 * then CSS runs a slow automatic drift. Disabled with reduced motion.
 */
export function useHoloTilt(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || reducedMotion) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--px", `${Math.round(x * 100)}%`);
        element.style.setProperty("--py", `${Math.round(y * 100)}%`);
        element.dataset.live = "true";
      });
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      set(
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height,
      );
    };
    const onLeave = () => {
      element.dataset.live = "false";
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      const x = Math.min(1, Math.max(0, (event.gamma + 30) / 60));
      const y = Math.min(1, Math.max(0, (event.beta - 20) / 60));
      set(x, y);
    };
    element.addEventListener("pointermove", onPointer);
    element.addEventListener("pointerleave", onLeave);
    const coarse = window.matchMedia("(hover: none)").matches;
    if (coarse && "DeviceOrientationEvent" in window)
      window.addEventListener("deviceorientation", onTilt);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", onPointer);
      element.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [enabled, reducedMotion, ref]);
}
