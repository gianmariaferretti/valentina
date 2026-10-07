import "server-only";

import { CookieCouponStateRepository } from "@/features/coupons/repositories/cookie-coupon-state-repository";
import type { CouponStateRepository } from "@/features/coupons/repositories/coupon-state-repository";

export function getCouponStateRepository(): CouponStateRepository {
  return new CookieCouponStateRepository();
}
