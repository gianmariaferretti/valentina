import "server-only";

import type { CouponWalletState } from "@/features/coupons/types";

export interface CouponStateRepository {
  get(): Promise<CouponWalletState>;
  redeem(couponId: string, redeemedAt: string): Promise<string>;
}
