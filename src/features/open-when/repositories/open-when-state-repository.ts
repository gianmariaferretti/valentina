import "server-only";

import type { OpenWhenState } from "@/features/open-when/types";

export interface OpenLetterStateInput {
  readonly slug: string;
  readonly openedAt: string;
  readonly rewardId: string | null;
  readonly rewardCouponId: string | null;
}

export interface SavedLetterState {
  readonly openedAt: string;
  readonly letterWasNew: boolean;
  readonly rewardWasNew: boolean;
}

export interface OpenWhenStateRepository {
  get(): Promise<OpenWhenState>;
  open(input: OpenLetterStateInput): Promise<SavedLetterState>;
}
