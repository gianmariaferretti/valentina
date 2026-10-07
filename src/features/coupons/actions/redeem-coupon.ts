"use server";

import { revalidatePath } from "next/cache";

import { getCoupon } from "@/data/coupons";
import {
  canRedeemCoupon,
  resolveCoupon,
} from "@/features/coupons/lib/coupon-domain";
import { getCouponStateRepository } from "@/features/coupons/repositories/get-coupon-state-repository";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  persistenceFailureMessage,
  reportPersistenceFailure,
} from "@/lib/persistence/persistence-error";

export interface RedeemCouponResult {
  status: "success" | "error";
  message: string;
  redeemedAt?: string;
}

export async function redeemCoupon(
  couponId: string,
): Promise<RedeemCouponResult> {
  if (!(await hasValidAccessSession())) {
    return {
      status: "error",
      message: "Your private session has expired. Please verify your identity.",
    };
  }

  const coupon = getCoupon(couponId);
  if (!coupon || coupon.status === "undiscovered") {
    return {
      status: "error",
      message: "This coupon does not exist. Allegedly.",
    };
  }

  try {
    const repository = getCouponStateRepository();
    const currentState = await repository.get();
    const resolvedCoupon = resolveCoupon(coupon, currentState);

    if (resolvedCoupon.status === "redeemed") {
      return { status: "error", message: "This coupon is already redeemed." };
    }

    if (!canRedeemCoupon(resolvedCoupon)) {
      return {
        status: "error",
        message:
          resolvedCoupon.unlockCondition ?? "This coupon is still locked.",
      };
    }

    const redeemedAt = await repository.redeem(
      resolvedCoupon.id,
      new Date().toISOString(),
    );

    revalidatePath("/coupons");
    revalidatePath(`/coupons/${resolvedCoupon.id}`);

    return {
      status: "success",
      message: "Coupon redeemed. Gianmaria has been formally notified.",
      redeemedAt,
    };
  } catch (error) {
    reportPersistenceFailure("redeem coupon", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This coupon"),
    };
  }
}
