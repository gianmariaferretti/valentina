import type { MediaAsset } from "@/features/media/types";

export type LongitudeLatitude = readonly [longitude: number, latitude: number];

export interface DestinationDateRange {
  readonly start: string | null;
  readonly end: string | null;
  readonly label: string;
}

export type DestinationImage = MediaAsset;

export interface DestinationSticker {
  readonly id: string;
  readonly kind:
    "airport-code" | "coordinates" | "date" | "postage" | "annotation";
  readonly text: string;
  readonly rotation: number;
}

export interface DestinationMemory {
  readonly id: string;
  readonly title: string;
  readonly note: string;
}

export interface Destination {
  readonly id: string;
  readonly slug: string;
  readonly city: string;
  readonly country: string;
  /** MapLibre uses longitude first, latitude second. */
  readonly coordinates: LongitudeLatitude;
  readonly dateRange: DestinationDateRange;
  readonly shortDescription: string;
  readonly longDescription: readonly string[];
  readonly coverImage: DestinationImage;
  readonly galleryImages: readonly DestinationImage[];
  readonly stickers: readonly DestinationSticker[];
  readonly memories: readonly DestinationMemory[];
  /** Editorial atlas order only. It does not represent trip chronology. */
  readonly atlasOrder: number;
  /** Configurable city/airport-style label used only as travel ephemera. */
  readonly travelCode: string;
  readonly stampTone: "burgundy" | "blue" | "mustard";
}
