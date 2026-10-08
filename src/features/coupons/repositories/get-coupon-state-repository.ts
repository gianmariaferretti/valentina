import "server-only";

import { cache } from "react";

import type { CouponStateRepository } from "@/features/coupons/repositories/coupon-state-repository";
import { SupabaseCouponStateRepository } from "@/features/coupons/repositories/supabase-coupon-state-repository";
import { EMPTY_COUPON_WALLET_STATE } from "@/features/coupons/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

export function getCouponStateRepository(): CouponStateRepository {
  return new SupabaseCouponStateRepository();
}

export const loadCouponState = cache(async function loadCouponState() {
  if (!(await hasValidAccessSession())) return EMPTY_COUPON_WALLET_STATE;

  try {
    return await getCouponStateRepository().get();
  } catch (error) {
    reportPersistenceFailure("load coupon state", error);
    return EMPTY_COUPON_WALLET_STATE;
  }
});
