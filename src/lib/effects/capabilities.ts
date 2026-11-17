"use client";

/**
 * Shared checks for the heavy visual effects (fluid, globe…): they run only
 * on devices that can afford them. Otherwise each effect shows its static
 * version.
 */

/** True when the device asks us to save energy (battery ≤ 20%, unplugged). */
export async function savingEnergy(): Promise<boolean> {
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
 * run on the CPU and freeze the page. `vg.force-effects` in localStorage
 * forces the effects on (for testing).
 */
export function hasFastWebGL(): boolean {
  try {
    if (window.localStorage.getItem("vg.force-effects") === "1") return true;
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

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** All the checks: reduced motion, energy saving, real GPU. */
export async function canRunEffects(): Promise<boolean> {
  if (prefersReducedMotion()) return false;
  if (await savingEnergy()) return false;
  return hasFastWebGL();
}

/** Runs `run` after the first paint, when the browser is idle. */
export function afterFirstPaint(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(run, 600);
  return () => clearTimeout(handle);
}
