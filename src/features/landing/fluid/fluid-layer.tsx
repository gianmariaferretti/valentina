"use client";

import { useEffect, useRef, useState } from "react";

import { createFluid, type FluidControls } from "./fluid-engine";
import { fluidBackground, fluidPalette } from "./palette";
import styles from "./fluid.module.css";

/**
 * The live fluid behind "YEAR TWO". Loaded with next/dynamic (ssr: false)
 * after the first paint. Runs only while the page is visible and on screen;
 * reads input passively, so it never steals the boarding-pass drag.
 */
export default function FluidLayer({ onFail }: { onFail: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const phone = window.matchMedia(
      "(max-width: 640px), (hover: none)",
    ).matches;
    const fluid: FluidControls | null = createFluid(canvas, {
      palette: fluidPalette,
      intensity: phone ? 0.28 : 0.2,
      // Reduced resolution on phones.
      pixelRatio: Math.min(window.devicePixelRatio || 1, phone ? 1 : 1.5),
      autoSplatEvery: 2.2,
      config: {
        SIM_RESOLUTION: phone ? 64 : 128,
        DYE_RESOLUTION: phone ? 384 : 768,
        DENSITY_DISSIPATION: 0.75,
        VELOCITY_DISSIPATION: 0.3,
        CURL: 22,
        SPLAT_RADIUS: phone ? 0.32 : 0.24,
        SPLAT_FORCE: 4500,
        COLOR_UPDATE_SPEED: 4,
        BACK_COLOR: fluidBackground,
        BLOOM: !phone,
        BLOOM_ITERATIONS: 6,
        BLOOM_RESOLUTION: 128,
        BLOOM_INTENSITY: 0.4,
        BLOOM_THRESHOLD: 0.7,
        SUNRAYS: false,
      },
    });
    if (!fluid) {
      onFail();
      return;
    }

    let onScreen = true;
    const sync = () => {
      if (onScreen && document.visibilityState === "visible") fluid.start();
      else fluid.stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    sync();
    const reveal = requestAnimationFrame(() => setLive(true));

    // Too slow on this device (under ~20 fps over the first frames)? Back
    // to the static gradient.
    let samples = 0;
    let last = performance.now();
    let slow = 0;
    let watch = requestAnimationFrame(function measure(now) {
      if (document.visibilityState === "visible") {
        if (now - last > 50) slow += 1;
        samples += 1;
      }
      last = now;
      if (samples >= 90) {
        if (slow > 30) onFail();
        return;
      }
      watch = requestAnimationFrame(measure);
    });

    // Passive listeners on the window: the fluid only watches, so taps,
    // scrolling and the boarding-pass drag work exactly as before.
    const down = (event: PointerEvent) =>
      fluid.pointerDown(event.pointerId, event.clientX, event.clientY);
    const move = (event: PointerEvent) =>
      fluid.pointerMove(
        event.pointerId,
        event.clientX,
        event.clientY,
        event.pointerType === "mouse",
      );
    const up = (event: PointerEvent) => fluid.pointerUp(event.pointerId);
    const options = { passive: true } as const;
    window.addEventListener("pointerdown", down, options);
    window.addEventListener("pointermove", move, options);
    window.addEventListener("pointerup", up, options);
    window.addEventListener("pointercancel", up, options);

    return () => {
      cancelAnimationFrame(reveal);
      cancelAnimationFrame(watch);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      fluid.destroy();
    };
  }, [onFail]);

  return (
    <canvas
      aria-hidden="true"
      className={styles.canvas}
      data-live={live}
      ref={canvasRef}
    />
  );
}
