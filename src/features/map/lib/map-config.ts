"use client";

import type { LongitudeLatitude } from "@/features/map/types";

export const DEFAULT_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? DEFAULT_MAP_STYLE_URL;

export type MapLibre = typeof import("maplibre-gl");

let loading: Promise<MapLibre> | null = null;

/**
 * MapLibre (about 1 MB of JavaScript) is downloaded only when a map is
 * actually drawn, after the page text is already on screen.
 */
export function loadMapLibre(): Promise<MapLibre> {
  loading ??= import("maplibre-gl").then((maplibre) => {
    maplibre.setWorkerUrl(
      new URL(
        "maplibre-gl/dist/maplibre-gl-worker.mjs",
        import.meta.url,
      ).toString(),
    );
    return maplibre;
  });
  return loading;
}

export function toMapLibreLngLat(
  coordinates: LongitudeLatitude,
): [number, number] {
  return [coordinates[0], coordinates[1]];
}
