"use client";

import { setWorkerUrl } from "maplibre-gl";

import type { LongitudeLatitude } from "@/features/map/types";

export const DEFAULT_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? DEFAULT_MAP_STYLE_URL;

let workerConfigured = false;

export function configureMapLibreWorker(): void {
  if (workerConfigured) return;

  setWorkerUrl(
    new URL(
      "maplibre-gl/dist/maplibre-gl-worker.mjs",
      import.meta.url,
    ).toString(),
  );
  workerConfigured = true;
}

export function toMapLibreLngLat(
  coordinates: LongitudeLatitude,
): [number, number] {
  return [coordinates[0], coordinates[1]];
}
