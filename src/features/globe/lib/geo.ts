/** Geometry for the globe: cobe angles, great circles, static projection. */

export type LatLng = readonly [number, number];

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** cobe's rotation angles that bring a place to the front. */
export function anglesFor([lat, lng]: LatLng): { phi: number; theta: number } {
  return { phi: Math.PI - (rad(lng) - Math.PI / 2), theta: rad(lat) };
}

function toVector([lat, lng]: LatLng): [number, number, number] {
  const φ = rad(lat);
  const λ = rad(lng);
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
}

/** A point at fraction t (0–1) along the great circle from a to b. */
export function alongGreatCircle(a: LatLng, b: LatLng, t: number): LatLng {
  const va = toVector(a);
  const vb = toVector(b);
  const dot = Math.min(
    1,
    Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]),
  );
  const ω = Math.acos(dot);
  if (ω < 1e-9) return a;
  const s = Math.sin(ω);
  const k1 = Math.sin((1 - t) * ω) / s;
  const k2 = Math.sin(t * ω) / s;
  const x = k1 * va[0] + k2 * vb[0];
  const y = k1 * va[1] + k2 * vb[1];
  const z = k1 * va[2] + k2 * vb[2];
  return [deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))];
}

/** The midpoint of several places (to face them all at once). */
export function centerOf(points: readonly LatLng[]): LatLng {
  if (points.length === 0) return [30, 0];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    const v = toVector(p);
    x += v[0];
    y += v[1];
    z += v[2];
  }
  return [deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))];
}

/**
 * Orthographic projection on a disc of radius r centred at (r, r), looking
 * at `center`. `visible` is false on the far side of the globe.
 */
export function project(
  [lat, lng]: LatLng,
  [lat0, lng0]: LatLng,
  r: number,
): { x: number; y: number; visible: boolean } {
  const φ = rad(lat);
  const λ = rad(lng);
  const φ0 = rad(lat0);
  const λ0 = rad(lng0);
  const cosc =
    Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
  const x = r * Math.cos(φ) * Math.sin(λ - λ0);
  const y =
    r *
    (Math.cos(φ0) * Math.sin(φ) -
      Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0));
  return { x: r + x, y: r - y, visible: cosc >= 0 };
}

/** SVG path of the visible part of a great-circle arc, slightly lifted. */
export function arcPath(
  a: LatLng,
  b: LatLng,
  center: LatLng,
  r: number,
  steps = 48,
): string {
  let d = "";
  let pen = false;
  // Long arcs rise more than short ones (like cobe's arcs).
  const va = toVector(a);
  const vb = toVector(b);
  const angle = Math.acos(
    Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])),
  );
  const height = 0.12 * Math.min(1, angle / (Math.PI / 3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = project(alongGreatCircle(a, b, t), center, r);
    const lift = 1 + height * Math.sin(Math.PI * t);
    const x = r + (p.x - r) * lift;
    const y = r + (p.y - r) * lift;
    if (!p.visible) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    pen = true;
  }
  return d;
}
