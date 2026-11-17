"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, type RefObject } from "react";

/** Only one card at a time is "live" (the one touched, hovered or focused). */
let releaseCurrent: (() => void) | null = null;

/**
 * Holographic effect, only where the eye is: on the card being touched,
 * hovered or focused (`data-active="true"`), or always on a `featured` card
 * (the coupon of the day). Every other card stays still: no animation, no
 * tilt listener. Drives `--px`/`--py` (0–100%) from the pointer or, on
 * phones, from device tilt. Disabled with reduced motion.
 */
export function useHoloTilt(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  featured = false,
) {
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || reducedMotion) return;
    let frame = 0;
    let tilting = false;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--px", `${Math.round(x * 100)}%`);
        element.style.setProperty("--py", `${Math.round(y * 100)}%`);
        element.dataset.live = "true";
      });
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      const x = Math.min(1, Math.max(0, (event.gamma + 30) / 60));
      const y = Math.min(1, Math.max(0, (event.beta - 20) / 60));
      set(x, y);
    };
    const coarse = window.matchMedia("(hover: none)").matches;
    const startTilt = () => {
      if (tilting || !coarse || !("DeviceOrientationEvent" in window)) return;
      window.addEventListener("deviceorientation", onTilt);
      tilting = true;
    };
    const stopTilt = () => {
      if (!tilting) return;
      window.removeEventListener("deviceorientation", onTilt);
      tilting = false;
    };

    const deactivate = () => {
      if (featured) return;
      element.dataset.active = "false";
      element.dataset.live = "false";
      stopTilt();
      if (releaseCurrent === deactivate) releaseCurrent = null;
    };
    const activate = () => {
      if (featured || releaseCurrent === deactivate) return;
      releaseCurrent?.();
      releaseCurrent = deactivate;
      element.dataset.active = "true";
      startTilt();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      set(
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height,
      );
    };
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "touch") activate();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== "touch") deactivate();
    };
    const onPointerDown = (event: PointerEvent) => {
      // On a phone the touched card stays live until another one is touched.
      if (event.pointerType === "touch") activate();
    };

    if (featured) {
      element.dataset.active = "true";
      startTilt();
    } else element.dataset.active = "false";
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("pointerdown", onPointerDown);
    // Keyboard focus lands on the link or button around the card.
    const focusTarget = element.closest<HTMLElement>("a, button") ?? element;
    focusTarget.addEventListener("focusin", activate);
    focusTarget.addEventListener("focusout", deactivate);
    return () => {
      cancelAnimationFrame(frame);
      stopTilt();
      if (releaseCurrent === deactivate) releaseCurrent = null;
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerenter", onPointerEnter);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("pointerdown", onPointerDown);
      focusTarget.removeEventListener("focusin", activate);
      focusTarget.removeEventListener("focusout", deactivate);
    };
  }, [enabled, featured, reducedMotion, ref]);
}
