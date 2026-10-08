"use client";
import { useEffect, useEffectEvent, useRef } from "react";
/** Backing-store resize never changes the logical playfield or resets a game. */
export function useArcadeCanvas(
  width: number,
  height: number,
  paint: (context: CanvasRenderingContext2D) => void,
  active = true,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useEffectEvent(paint);
  useEffect(() => {
    const canvas = ref.current,
      context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect(),
        dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    const render = () => {
      context.setTransform(
        canvas.width / width,
        0,
        0,
        canvas.height / height,
        0,
        0,
      );
      context.clearRect(0, 0, width, height);
      draw(context);
    };
    const loop = () => {
      render();
      frame = requestAnimationFrame(loop);
    };
    resize();
    if (active) frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [active, height, width]);
  return ref;
}
