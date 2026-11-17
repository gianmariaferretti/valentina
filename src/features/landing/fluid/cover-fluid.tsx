"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { afterFirstPaint, canRunEffects } from "@/lib/effects/capabilities";

import styles from "./fluid.module.css";

// WebGL code is downloaded only on the cover, in the browser.
const FluidLayer = dynamic(() => import("./fluid-layer"), { ssr: false });

type Mode = "static" | "fluid";

/**
 * The cover background: a slow CSS gradient in the site colours, always
 * there; on capable devices the live fluid fades in over it after the
 * first paint. Reduced motion, low battery or no WebGL keep the gradient.
 */
export function CoverFluid() {
  const [mode, setMode] = useState<Mode>("static");
  const fail = useCallback(() => setMode("static"), []);

  useEffect(() => {
    let cancelled = false;
    const cancelIdle = afterFirstPaint(() => {
      void canRunEffects().then((ok) => {
        if (ok && !cancelled) setMode("fluid");
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  return (
    <div aria-hidden="true" className={styles.stage}>
      <div className={styles.gradient} />
      {mode === "fluid" ? <FluidLayer onFail={fail} /> : null}
      {/* Keeps the title readable (AA) over the brightest swirls. */}
      <div className={styles.scrim} />
    </div>
  );
}
