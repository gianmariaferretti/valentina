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

interface AwardBase {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  readonly photo: AwardPhoto;
  readonly evidence?: AwardEvidence;
  readonly sticker: AwardSticker;
  readonly prize?: string;
  readonly presentation: "standard" | "wide" | "finale";
}

export type Award = AwardBase &
  (
    | {
        readonly status?: "active";
        readonly nominees: readonly AwardNominee[];
        readonly winnerId: string;
      }
    | {
        readonly status: "cancelled";
        readonly nominees: readonly [];
        readonly winnerId: null;
      }
  );
