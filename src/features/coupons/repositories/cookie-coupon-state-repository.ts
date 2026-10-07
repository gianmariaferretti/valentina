import "server-only";

import { cookies } from "next/headers";

import type { CouponStateRepository } from "@/features/coupons/repositories/coupon-state-repository";
import {
  EMPTY_COUPON_WALLET_STATE,
  type CouponRedemption,
  type CouponWalletState,
} from "@/features/coupons/types";
import { decodeSignedState, encodeSignedState } from "@/lib/auth/signed-state";

const COUPON_STATE_COOKIE = "vg_coupon_state";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 365;

function isCouponRedemption(value: unknown): value is CouponRedemption {
  if (!value || typeof value !== "object") return false;

  const redemption = value as Record<string, unknown>;
  return (
    typeof redemption.couponId === "string" &&
    typeof redemption.redeemedAt === "string" &&
    !Number.isNaN(Date.parse(redemption.redeemedAt))
  );
}

function parseState(value: string | undefined): CouponWalletState {
  const parsed = decodeSignedState(value);
  if (!parsed || typeof parsed !== "object") return EMPTY_COUPON_WALLET_STATE;

  const record = parsed as Record<string, unknown>;
  const redemptions = Array.isArray(record.redemptions)
    ? record.redemptions.filter(isCouponRedemption)
    : [];
  const unlockedCouponIds = Array.isArray(record.unlockedCouponIds)
    ? record.unlockedCouponIds.filter(
        (couponId): couponId is string => typeof couponId === "string",
      )
    : [];

  return { version: 1, redemptions, unlockedCouponIds };
}

export class CookieCouponStateRepository implements CouponStateRepository {
  async get(): Promise<CouponWalletState> {
    const cookieStore = await cookies();
    return parseState(cookieStore.get(COUPON_STATE_COOKIE)?.value);
  }

  async save(state: CouponWalletState): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(COUPON_STATE_COOKIE, encodeSignedState(state), {
      httpOnly: true,
      maxAge: COOKIE_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
