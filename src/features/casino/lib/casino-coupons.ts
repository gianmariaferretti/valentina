import { getCasinoPrize, prizeRarity } from "../../../data/casino-prizes.ts";
import type { Coupon } from "@/features/coupons/types";

export interface CasinoWinRecord {
  readonly couponId: string;
  readonly code: string;
  readonly prizeId: string;
  readonly wonAt: string;
}

export const CASINO_COUPON_PATTERN = /^casino-c\d{3,6}$/;

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/** Turns a stored Kiss Casino win into a wallet coupon instance. */
export function casinoWinToCoupon(win: CasinoWinRecord): Coupon | null {
  const prize = getCasinoPrize(win.prizeId);
  if (!prize || !CASINO_COUPON_PATTERN.test(win.couponId)) return null;
  return {
    id: win.couponId,
    code: win.code,
    title: prize.title,
    shortDescription: prize.shortDescription,
    description: prize.description,
    category: prize.category,
    rarity: prizeRarity[prize.kind],
    setting: prize.setting,
    source: "casino",
    type: "standard",
    status: "available",
    redeemable: true,
    challengeId: null,
    unlockCondition: null,
    secret: false,
    createdAt: win.wonAt,
    redeemedAt: null,
    terms: [
      `Won at the Kiss Casino on ${formatDay(win.wonAt)}. The house regrets everything.`,
      "Valid once.",
      "Subject to mutual availability, Wi-Fi and common sense.",
    ],
  };
}
