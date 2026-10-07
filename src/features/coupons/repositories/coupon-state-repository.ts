import "server-only";

import type { CouponWalletState } from "@/features/coupons/types";

/**
 * Persistence boundary for coupon state. A Supabase implementation can replace
 * the signed-cookie adapter without changing route or component contracts.
 */
export interface CouponStateRepository {
  get(): Promise<CouponWalletState>;
  save(state: CouponWalletState): Promise<void>;
}
