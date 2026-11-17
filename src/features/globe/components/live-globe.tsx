"use client";

import createGlobe, { type Arc, type Globe, type Marker } from "cobe";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { alongGreatCircle, anglesFor, centerOf } from "../lib/geo";
import type { GlobeProps } from "../lib/types";

type Rgb = [number, number, number];

const THEMES: Record<
  "paper" | "night",
  {
    dark: number;
    base: Rgb;
    marker: Rgb;
    glow: Rgb;
    arc: Rgb;
    arcDim: Rgb;
    mapBrightness: number;
    opacity: number;
  }
> = {
  paper: {
    dark: 0,
    base: [0.98, 0.95, 0.9],
    marker: [0.55, 0.11, 0.2],
    glow: [0.95, 0.91, 0.85],
    arc: [0.58, 0.16, 0.2],
    arcDim: [0.8, 0.66, 0.6],
    mapBrightness: 3.2,
    opacity: 0.95,
  },
  night: {
    dark: 1,
    base: [0.42, 0.3, 0.3],
    marker: [0.84, 0.65, 0.3],
    glow: [0.3, 0.12, 0.14],
    arc: [0.84, 0.65, 0.3],
    arcDim: [0.45, 0.33, 0.25],
    mapBrightness: 5,
    opacity: 0.75,
  },
};

const LABEL =
  "pointer-events-none absolute z-[1] mb-1.5 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full whitespace-nowrap px-2 py-0.5 text-[0.68rem] leading-tight transition-[opacity,filter] duration-300 data-[below=true]:mt-1.5 data-[below=true]:mb-0 max-sm:group-data-[compact=true]/globe:hidden";

const anchorSupported = () =>
  typeof CSS !== "undefined" && CSS.supports("anchor-name: --x");

function timeIn(timeZone: string, now: Date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).format(now);
  } catch {
    return "";
  }
}

/**
 * The live globe (cobe, MIT). Rotates slowly, follows the finger with
 * inertia, lights its arcs one after the other. Paused when off screen or
 * in a hidden tab; lower resolution on phones.
 */
export default function LiveGlobe({
  points,
  arcs = [],
  plane,
  theme = "paper",
  showLabels = true,
  onReady,
}: GlobeProps & { onReady?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [now, setNow] = useState<Date | null>(null);
  const [native] = useState(anchorSupported);

  useEffect(() => {
    if (!points.some((p) => p.timeZone)) return;
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [points]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const palette = THEMES[theme];
    const phone = window.matchMedia(
      "(max-width: 640px), (hover: none)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    let size = wrap.clientWidth;

    const start = anglesFor(centerOf(points.map((p) => p.location)));
    let phi = start.phi;
    let theta = Math.max(-0.4, Math.min(0.7, start.theta * 0.8));
    let velocity = 0;
    let dragging: { x: number; y: number } | null = null;
    let active = 0;
    let lastSwitch = performance.now();

    const markers = (t: number): Marker[] => {
      const list: Marker[] = points.map((p) => ({
        location: [p.location[0], p.location[1]],
        size: 0.05,
        id: p.id,
      }));
      if (plane) {
        const at = alongGreatCircle(plane.from, plane.to, t);
        list.push({
          location: [at[0], at[1]],
          size: 0.02,
          id: "plane",
          color: palette.arc,
        });
      }
      return list;
    };
    const arcList = (): Arc[] => [
      ...arcs.map((arc, index) => ({
        from: [arc.from[0], arc.from[1]] as [number, number],
        to: [arc.to[0], arc.to[1]] as [number, number],
        id: arc.id,
        color: index === active ? palette.arc : palette.arcDim,
      })),
      ...(plane
        ? [
            {
              from: [plane.from[0], plane.from[1]] as [number, number],
              to: [plane.to[0], plane.to[1]] as [number, number],
              id: "route",
              color: palette.arc,
            },
          ]
        : []),
    ];

    let globe: Globe;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta,
        dark: palette.dark,
        diffuse: 1.2,
        mapSamples: phone ? 9000 : 16000,
        mapBrightness: palette.mapBrightness,
        mapBaseBrightness: 0,
        baseColor: palette.base,
        markerColor: palette.marker,
        glowColor: palette.glow,
        markers: markers(0),
        arcs: arcList(),
        arcColor: palette.arc,
        arcWidth: 0.6,
        arcHeight: 0.28,
        markerElevation: 0.02,
        opacity: palette.opacity,
      });
    } catch {
      return;
    }

    let frame = 0;
    let running = false;
    let readyCalled = false;
    const loop = (time: number) => {
      if (!running) return;
      if (!dragging) {
        phi += 0.0022 + velocity;
        velocity *= 0.94;
      }
      if (arcs.length > 1 && time - lastSwitch > 1600) {
        active = (active + 1) % arcs.length;
        lastSwitch = time;
      }
      const width = wrap.clientWidth;
      if (width !== size && width > 0) size = width;
      globe.update({
        phi,
        theta,
        width: size * dpr,
        height: size * dpr,
        markers: markers((((time / 7000) % 1) + 1) % 1),
        arcs: arcList(),
      });
      if (!native) placeLabels();
      if (!readyCalled) {
        readyCalled = true;
        onReady?.();
      }
      frame = requestAnimationFrame(loop);
    };

    // Without CSS anchor positioning: copy cobe's anchor dots' positions.
    const placeLabels = () => {
      for (const anchor of wrap.querySelectorAll<HTMLElement>(
        "div[style*='anchor-name']",
      )) {
        const name = /anchor-name:\s*--cobe-([\w-]+)/.exec(
          anchor.getAttribute("style") ?? "",
        )?.[1];
        const label = name ? labelsRef.current.get(name) : undefined;
        if (!label) continue;
        label.style.left = anchor.style.left;
        label.style.top = anchor.style.top;
      }
    };

    const sync = (visible: boolean) => {
      if (visible && document.visibilityState === "visible") {
        if (running) return;
        running = true;
        frame = requestAnimationFrame(loop);
      } else {
        running = false;
        cancelAnimationFrame(frame);
      }
    };
    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync(onScreen);
    });
    observer.observe(wrap);
    const onVisibility = () => sync(onScreen);
    document.addEventListener("visibilitychange", onVisibility);

    // Drag with inertia (horizontal on phones so the page still scrolls).
    const down = (event: PointerEvent) => {
      dragging = { x: event.clientX, y: event.clientY };
      velocity = 0;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - dragging.x;
      const dy = event.clientY - dragging.y;
      dragging = { x: event.clientX, y: event.clientY };
      phi += dx / 180;
      velocity = dx / 180;
      if (event.pointerType === "mouse")
        theta = Math.max(-0.6, Math.min(0.9, theta + dy / 240));
    };
    const up = () => {
      dragging = null;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      globe.destroy();
    };
  }, [points, arcs, plane, theme, native, onReady]);

  const labelStyle = (id: string, below?: boolean): CSSProperties =>
    ({
      ...(native
        ? {
            positionAnchor: `--cobe-${id}`,
            ...(below ? { top: "anchor(bottom)" } : { bottom: "anchor(top)" }),
            left: "anchor(center)",
          }
        : {}),
      opacity: `var(--cobe-visible-${id}, 0)`,
      filter: `blur(calc((1 - var(--cobe-visible-${id}, 0)) * 6px))`,
    }) as CSSProperties;

  return (
    <div
      className="absolute inset-0 opacity-0 transition-opacity duration-700 group-data-[live=true]/globe:opacity-100"
      ref={wrapRef}
    >
      <canvas
        aria-hidden="true"
        className="size-full cursor-grab touch-pan-y [contain:layout_paint_size] active:cursor-grabbing"
        ref={canvasRef}
      />
      {showLabels
        ? points
            .filter((point) => !point.quiet)
            .map((point) => (
              <span
                aria-hidden="true"
                className={`${LABEL} ${
                  theme === "night"
                    ? "bg-[rgba(36,30,28,0.6)] text-[0.56rem] tracking-[0.12em] text-[rgba(244,231,211,0.75)] uppercase [&_strong]:font-medium"
                    : "bg-[rgba(251,248,243,0.92)] text-[var(--ink)] shadow-[0_4px_12px_rgba(36,30,28,0.12)]"
                } ${native ? "" : point.below ? "mt-0 translate-y-1.5" : "mb-0 -translate-y-[calc(100%+6px)]"}`}
                data-below={point.below ? "true" : undefined}
                key={point.id}
                ref={(element) => {
                  if (element) labelsRef.current.set(point.id, element);
                  else labelsRef.current.delete(point.id);
                }}
                style={labelStyle(point.id, point.below)}
              >
                <strong>{point.name}</strong>
                {point.timeZone && now ? (
                  <span className="font-mono tabular-nums">
                    {timeIn(point.timeZone, now)}
                  </span>
                ) : null}
                {point.badge ? <span>{point.badge}</span> : null}
              </span>
            ))
        : null}
      {plane ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 -rotate-[20deg] text-base text-[var(--rust)]"
          ref={(element) => {
            if (element) labelsRef.current.set("plane", element);
            else labelsRef.current.delete("plane");
          }}
          style={
            {
              ...(native
                ? {
                    positionAnchor: "--cobe-plane",
                    top: "anchor(center)",
                    left: "anchor(center)",
                  }
                : {}),
              opacity: "var(--cobe-visible-plane, 0)",
            } as CSSProperties
          }
        >
          ✈
        </span>
      ) : null}
    </div>
  );
}
