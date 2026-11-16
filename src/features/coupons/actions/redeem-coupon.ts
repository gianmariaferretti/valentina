"use server";

import { casinoConfig } from "@/data/casino-config";
import { getCoupon } from "@/data/coupons";
import {
  findCasinoCoupon,
  redeemCasinoCouponWithReset,
} from "@/features/casino/repositories/load-casino";
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
  /** Redeeming a casino coupon started a fresh casino season. */
  casinoReset?: boolean;
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

  if (typeof couponId !== "string" || couponId.length > 100) {
    return {
      status: "error",
      message: "This coupon does not exist. Allegedly.",
    };
  }

  // Kiss Casino wins are per-win instances stored outside the fixed catalogue.
  const coupon = getCoupon(couponId) ?? (await findCasinoCoupon(couponId));
  if (!coupon) {
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

    // A coupon won at the Kiss Casino also wipes the casino clean, in the
    // same database transaction as the redemption (see casino-config.ts).
    const casinoReset =
      resolvedCoupon.source === "casino" &&
      casinoConfig.reset.resetOnCasinoCouponRedeem;
    const now = new Date().toISOString();
    const redeemedAt = casinoReset
      ? await redeemCasinoCouponWithReset(resolvedCoupon.id, now)
      : await repository.redeem(resolvedCoupon.id, now);

    // No revalidatePath here: inside a Server Action it re-renders the page
    // being viewed immediately, which used to cut the tear animation short.
    // Every coupon page is dynamic; the client refreshes once the stub has
    // fallen and the stamp has landed (see ticket-tear.tsx).

    return {
      status: "success",
      message: "Coupon redeemed. Gianmaria has been formally notified.",
      redeemedAt,
      casinoReset,
    };
  } catch (error) {
    reportPersistenceFailure("redeem coupon", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This coupon"),
    };
  }
}
