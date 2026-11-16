"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

interface ScratchSurfaceProps {
  children: ReactNode;
  /** Called once when enough is scratched or the Reveal button is used. */
  onReveal: () => void;
  /** Accessible label for the Reveal button. */
  revealLabel?: string;
  /** Text printed on the foil. */
  coverText?: string;
  /** Share of the foil to clear before auto-reveal. */
  threshold?: number;
  tone?: "silver" | "gold" | "bronze";
  className?: string;
  /** Hide the visible Reveal button (callers then provide their own). */
  hideButton?: boolean;
}

const tones = {
  silver: ["#d9d6d0", "#a9a49c", "#efece6"],
  gold: ["#f1d77a", "#c99a2e", "#fbeaa8"],
  bronze: ["#d9a272", "#9a6034", "#ecc29a"],
} as const;

/**
 * A canvas foil that can be scratched with a finger or a mouse. Always paired
 * with a keyboard-accessible Reveal button; with reduced motion the foil
 * simply disappears instead of fading.
 */
export function ScratchSurface({
  children,
  onReveal,
  revealLabel = "Reveal",
  coverText = "SCRATCH HERE",
  threshold = 0.5,
  tone = "silver",
  className,
  hideButton = false,
}: ScratchSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    onReveal();
  }, [onReveal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const paint = () => {
      if (revealedRef.current) return;
      const rect = wrapper.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const [base, dark, light] = tones[tone];
      const gradient = context.createLinearGradient(
        0,
        0,
        rect.width,
        rect.height,
      );
      gradient.addColorStop(0, light);
      gradient.addColorStop(0.45, base);
      gradient.addColorStop(1, dark);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      context.fillStyle = "rgba(255,255,255,0.18)";
      for (let x = -rect.height; x < rect.width; x += 14) {
        context.fillRect(x, 0, 3, rect.height);
      }
      context.fillStyle = "rgba(36,30,28,0.55)";
      context.font = "800 12px ui-sans-serif, system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText(coverText, rect.width / 2, rect.height / 2 - 8);
      context.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      context.fillText(
        "✦ swipe sideways to scratch ✦",
        rect.width / 2,
        rect.height / 2 + 10,
      );
    };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [coverText, tone]);

  function pointFor(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function scratch(point: { x: number; y: number }) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    // Wider strokes on wider cards, so a few finger swipes are enough.
    context.lineWidth = Math.max(34, canvas.clientWidth * 0.14);
    context.beginPath();
    const from = lastPoint.current ?? point;
    context.moveTo(from.x, from.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint.current = point;
    strokes.current += 1;
    if (strokes.current % 8 === 0) checkCleared(canvas, context);
  }

  function checkCleared(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) {
    const step = 8;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    let total = 0;
    for (let index = 3; index < data.length; index += 4 * step) {
      total += 1;
      if (data[index] === 0) cleared += 1;
    }
    if (total > 0 && cleared / total >= threshold) reveal();
  }

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      {children}
      {revealed ? null : (
        <>
          <canvas
            aria-hidden="true"
            // pan-y: vertical swipes still scroll the page on phones;
            // sideways strokes scratch.
            className="absolute inset-0 z-10 size-full cursor-grab touch-pan-y rounded-[inherit]"
            onPointerDown={(event) => {
              drawing.current = true;
              lastPoint.current = null;
              event.currentTarget.setPointerCapture(event.pointerId);
              scratch(pointFor(event));
            }}
            onPointerMove={(event) => {
              if (drawing.current) scratch(pointFor(event));
            }}
            onPointerUp={() => {
              drawing.current = false;
              lastPoint.current = null;
            }}
            onPointerCancel={() => {
              drawing.current = false;
              lastPoint.current = null;
            }}
            ref={canvasRef}
          />
          {hideButton ? null : (
            <button
              className="absolute bottom-3 left-1/2 z-20 min-h-11 -translate-x-1/2 rounded-full bg-[var(--ink)] px-5 text-[0.62rem] font-bold tracking-[0.14em] text-[var(--paper-white)] uppercase shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rust)]"
              onClick={reveal}
              type="button"
            >
              {revealLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
