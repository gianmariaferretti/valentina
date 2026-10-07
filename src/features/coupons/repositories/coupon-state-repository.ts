import "server-only";

import type { CouponWalletState } from "@/features/coupons/types";

export interface CouponUnlockInput {
  readonly couponId: string;
  readonly discoveredAt: string;
  readonly discoveryId: string;
  readonly source: string;
}

export interface CouponStateRepository {
  get(): Promise<CouponWalletState>;
  redeem(couponId: string, redeemedAt: string): Promise<string>;
  unlock(input: CouponUnlockInput): Promise<boolean>;
}
