import type { LatLng } from "./geo.ts";

export interface GlobePoint {
  /** CSS-ident safe id (used for anchor names). */
  readonly id: string;
  readonly name: string;
  readonly location: LatLng;
  /** IANA time zone: the label shows the live local time. */
  readonly timeZone?: string;
  /** Extra label text, e.g. "14°". */
  readonly badge?: string;
  /** Meteocons icon slug and its label, shown next to the badge. */
  readonly weather?: { readonly icon: string; readonly label: string };
  /** Put the label under the dot (when a nearby city's label is above). */
  readonly below?: boolean;
  /** Dot only, no label (crowded clusters on small globes). */
  readonly quiet?: boolean;
}

/** Marks points too close to an earlier one: their label goes below. */
export function staggerLabels<T extends { location: LatLng }>(
  points: readonly T[],
  minDegrees = 4,
): (T & { below: boolean })[] {
  const placed: T[] = [];
  return points.map((point) => {
    const near = placed.some(
      (other) =>
        Math.hypot(
          other.location[0] - point.location[0],
          other.location[1] - point.location[1],
        ) < minDegrees,
    );
    placed.push(point);
    return { ...point, below: near };
  });
}

export interface GlobeArc {
  readonly id: string;
  readonly from: LatLng;
  readonly to: LatLng;
}

/** "paper" for the private pages, "night" for the dark cover. */
export type GlobeTheme = "paper" | "night";

export interface GlobeProps {
  readonly points: readonly GlobePoint[];
  readonly arcs?: readonly GlobeArc[];
  /** A little plane travelling along this arc. */
  readonly plane?: { readonly from: LatLng; readonly to: LatLng };
  readonly theme?: GlobeTheme;
  /** Accessible description of what the globe shows. */
  readonly label: string;
  readonly showLabels?: boolean;
  /** Hide the labels on narrow screens (small globes). */
  readonly compact?: boolean;
}

/** "Polignano a Mare" → "polignano-a-mare". */
export function globeId(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "place"
  );
}
