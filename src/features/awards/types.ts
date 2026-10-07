import type { StickerVariant } from "@/types/design-system";

export interface AwardNominee {
  readonly id: string;
  readonly name: string;
  readonly citation: string;
}

export interface AwardEvidence {
  readonly label: string;
  readonly value: string;
}

export interface AwardPhoto {
  readonly src: string;
  readonly alt: string;
  readonly position?: string;
}

export interface AwardSticker {
  readonly variant: StickerVariant;
  readonly text: string;
  readonly rotation: number;
}

export interface Award {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  readonly nominees: readonly AwardNominee[];
  readonly winnerId: AwardNominee["id"];
  readonly photo: AwardPhoto;
  readonly evidence?: AwardEvidence;
  readonly sticker: AwardSticker;
  readonly prize?: string;
  readonly presentation: "standard" | "wide" | "finale";
}
