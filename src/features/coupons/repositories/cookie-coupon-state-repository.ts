import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { CouponStateRepository } from "@/features/coupons/repositories/coupon-state-repository";
import {
  EMPTY_COUPON_WALLET_STATE,
  type CouponRedemption,
  type CouponWalletState,
} from "@/features/coupons/types";
import { getAuthSecret } from "@/lib/auth/session";

const COUPON_STATE_COOKIE = "vg_coupon_state";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 365;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

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
  const secret = getAuthSecret();
  if (!value || !secret) return EMPTY_COUPON_WALLET_STATE;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return EMPTY_COUPON_WALLET_STATE;

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return EMPTY_COUPON_WALLET_STATE;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    const redemptions = Array.isArray(parsed.redemptions)
      ? parsed.redemptions.filter(isCouponRedemption)
      : [];

    return { version: 1, redemptions };
  } catch {
    return EMPTY_COUPON_WALLET_STATE;
  }
}

function serializeState(state: CouponWalletState): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET must be configured in production.");

  const payload = Buffer.from(JSON.stringify(state), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload, secret)}`;
}

export class CookieCouponStateRepository implements CouponStateRepository {
  async get(): Promise<CouponWalletState> {
    const cookieStore = await cookies();
    return parseState(cookieStore.get(COUPON_STATE_COOKIE)?.value);
  }

  async save(state: CouponWalletState): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(COUPON_STATE_COOKIE, serializeState(state), {
      httpOnly: true,
      maxAge: COOKIE_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
