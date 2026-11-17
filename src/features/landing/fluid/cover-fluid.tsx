"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import styles from "./fluid.module.css";

// WebGL code is downloaded only on the cover, in the browser.
const FluidLayer = dynamic(() => import("./fluid-layer"), { ssr: false });

type Mode = "static" | "fluid";

/** True when the device asks us to save energy. */
async function savingEnergy(): Promise<boolean> {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{ charging: boolean; level: number }>;
  };
  try {
    const battery = await nav.getBattery?.();
    return Boolean(battery && !battery.charging && battery.level <= 0.2);
  } catch {
    return false;
  }
}

/**
 * WebGL with a real GPU. A software renderer (SwiftShader, llvmpipe…) would
 * run the simulation on the CPU and freeze the page: keep the gradient.
 */
function hasFastWebGL(): boolean {
  try {
    if (window.localStorage.getItem("vg.force-fluid") === "1") return true;
  } catch {
    // Storage may be unavailable; ignore.
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|software|softpipe/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * The cover background: a slow CSS gradient in the site colours, always
 * there; on capable devices the live fluid fades in over it after the
 * first paint. Reduced motion, low battery or no WebGL keep the gradient.
 */
export function CoverFluid() {
  const [mode, setMode] = useState<Mode>("static");
  const fail = useCallback(() => setMode("static"), []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const begin = async () => {
      if (cancelled || (await savingEnergy()) || !hasFastWebGL()) return;
      if (!cancelled) setMode("fluid");
    };
    // After the first paint, when the browser is idle.
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle
      ? window.requestIdleCallback(() => void begin(), { timeout: 1500 })
      : setTimeout(() => void begin(), 600);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle as number);
      else clearTimeout(handle);
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
