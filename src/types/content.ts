import type { IconName } from "@/types/navigation";

export type ContentStatus = "foundation" | "ready-for-content";

export interface ExperienceSection {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly href: string;
  readonly icon: IconName;
  readonly status: ContentStatus;
  readonly tone: "ink" | "paper" | "rust";
}

export interface Challenge {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly format: string;
}

export interface Place {
  readonly slug: string;
  readonly city: string;
  readonly country: string;
  readonly coordinates: readonly [number, number];
  readonly summary: string;
}

export interface OpenWhenLetter {
  readonly slug: string;
  readonly title: string;
  readonly preview: string;
}
