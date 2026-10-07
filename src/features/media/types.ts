export const mediaCategories = ["us", "trips", "random", "food"] as const;
export type MediaCategory = (typeof mediaCategories)[number];

export type MediaSurface = "gallery" | "map" | "awards" | "home" | "secret";

export interface MediaLocation {
  readonly label: string;
  readonly code?: string;
}

export interface GalleryPresentation {
  readonly format: "editorial" | "polaroid" | "photo-strip";
  readonly size: "hero" | "wide" | "portrait" | "standard" | "small";
  readonly rotation: number;
  readonly tape: "none" | "cream" | "rose" | "yellow" | "clear";
  readonly note?: string;
}

/**
 * Canonical image metadata shared by every feature. Routes store or request a
 * media ID rather than creating their own src/alt/caption records.
 */
export interface MediaAsset {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption: string;
  readonly date: string | null;
  readonly dateLabel: string;
  readonly location: MediaLocation | null;
  readonly category: MediaCategory;
  readonly featured: boolean;
  readonly relatedPlace: string | null;
  readonly position?: string;
  readonly surfaces: readonly MediaSurface[];
  readonly gallery?: GalleryPresentation;
}

export type GalleryMediaAsset = MediaAsset & {
  readonly gallery: GalleryPresentation;
};

export type GalleryFilter = "all" | MediaCategory | "favourites";
