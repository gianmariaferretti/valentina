"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { afterFirstPaint, canRunEffects } from "@/lib/effects/capabilities";

import type { GlobeProps } from "../lib/types";
import { StaticGlobe } from "./static-globe";

// cobe (WebGL) is downloaded only where a globe is on screen.
const LiveGlobe = dynamic(() => import("./live-globe"), { ssr: false });

/**
 * A globe: the static SVG first (no layout shift, no LCP cost); the live
 * WebGL globe replaces it after the first paint, once it is on screen, on
 * devices that can afford it.
 */
export function CityGlobe(props: GlobeProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [live, setLive] = useState(false);
  const ready = useCallback(() => setLive(true), []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let cancelled = false;
    let cancelIdle = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        cancelIdle = afterFirstPaint(() => {
          void canRunEffects().then((ok) => {
            if (ok && !cancelled) setMount(true);
          });
        });
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(frame);
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelIdle();
    };
  }, []);

  return (
    <div
      className="group/globe relative aspect-square w-full"
      data-compact={props.compact ? "true" : undefined}
      data-live={live}
      ref={frameRef}
    >
      <div className="absolute inset-0 transition-opacity duration-500 group-data-[live=true]/globe:opacity-0">
        <StaticGlobe {...props} />
      </div>
      {mount ? <LiveGlobe {...props} onReady={ready} /> : null}
    </div>
  );
}
