"use server";

import { after } from "next/server";
import { z } from "zod";

import { casinoConfig } from "@/data/casino-config";
import { findCatalogueCoupon } from "@/features/admin/repositories/content";
import { notifyCouponRedeemed } from "@/features/notifications/notify";
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
  /** The email to Gianmaria really left (Resend accepted it). */
  notified?: boolean;
}

/** How long the redemption waits for the email before answering. */
const NOTIFY_WAIT_MS = 2500;

const couponIdSchema = z.string().regex(/^[a-z0-9-]{1,100}$/);

export async function redeemCoupon(
  couponId: string,
): Promise<RedeemCouponResult> {
  if (!(await hasValidAccessSession())) {
    return {
      status: "error",
      message: "Your private session has expired. Please verify your identity.",
    };
  }

  if (!couponIdSchema.safeParse(couponId).success) {
    return {
      status: "error",
      message: "This coupon does not exist. Allegedly.",
    };
  }

  // Kiss Casino wins are per-win instances stored outside the fixed catalogue.
  const coupon =
    (await findCatalogueCoupon(couponId)) ?? (await findCasinoCoupon(couponId));
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

    // The email never blocks the redemption: it is already saved. If Resend
    // is slow, sending continues after the response (and is retried later).
    const sending = notifyCouponRedeemed({
      id: resolvedCoupon.id,
      title: resolvedCoupon.title,
      setting: resolvedCoupon.setting,
      rarity: resolvedCoupon.rarity,
      redeemedAt,
    });
    const status = await Promise.race([
      sending,
      new Promise<"slow">((resolve) =>
        setTimeout(() => resolve("slow"), NOTIFY_WAIT_MS),
      ),
    ]);
    if (status === "slow") after(() => sending.then(() => undefined));

    return {
      status: "success",
      message: "Coupon redeemed.",
      redeemedAt,
      casinoReset,
      notified: status === "sent",
    };
  } catch (error) {
    reportPersistenceFailure("redeem coupon", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This coupon"),
    };
  }
}
