import type {
  Coupon,
  CouponWalletItem,
  CouponWalletState,
  CouponWalletStats,
  ResolvedCoupon,
} from "@/features/coupons/types";

export function resolveCoupon(
  coupon: Coupon,
  walletState: CouponWalletState,
): ResolvedCoupon {
  const savedRedemption = walletState.redemptions.find(
    (redemption) => redemption.couponId === coupon.id,
  );

  if (savedRedemption) {
    return {
      ...coupon,
      status: "redeemed",
      redeemedAt: savedRedemption.redeemedAt,
    };
  }

  if (walletState.unlockedCouponIds.includes(coupon.id)) {
    return {
      ...coupon,
      status: "available",
      redeemable: coupon.fulfillmentReady !== false,
      redeemedAt: null,
    };
  }

  return coupon;
}

export function resolveCoupons(
  coupons: readonly Coupon[],
  walletState: CouponWalletState,
): readonly ResolvedCoupon[] {
  return coupons.map((coupon) => resolveCoupon(coupon, walletState));
}

export function canRedeemCoupon(coupon: ResolvedCoupon): boolean {
  return (
    coupon.status === "available" &&
    coupon.redeemable &&
    coupon.fulfillmentReady !== false &&
    coupon.retired !== true
  );
}

/** Retired duplicates disappear from the wallet unless they were already used. */
export function isVisibleInWallet(coupon: ResolvedCoupon): boolean {
  return coupon.retired !== true || coupon.status === "redeemed";
}

export function createWalletItem(coupon: ResolvedCoupon): CouponWalletItem {
  if (coupon.status === "undiscovered") {
    return {
      id: coupon.id,
      code: "GV-???",
      title: "???",
      shortDescription: "This coupon has not revealed itself yet.",
      category: null,
      rarity: null,
      setting: coupon.setting,
      type: null,
      status: "undiscovered",
      href: null,
      callToAction: null,
      secret: true,
      source: coupon.source ?? "catalogue",
      series: null,
      unlockCondition: null,
      redeemedAt: null,
      scratchable: false,
    };
  }

  const requiresChallenge =
    coupon.type === "challenge" && coupon.status === "locked";

  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    shortDescription: coupon.shortDescription,
    category: coupon.category,
    rarity: coupon.rarity,
    setting: coupon.setting,
    type: coupon.type,
    status: coupon.status,
    href: requiresChallenge
      ? `/challenges/${coupon.challengeId}`
      : `/coupons/${coupon.id}`,
    callToAction: requiresChallenge ? "WIN TO REDEEM" : "VIEW COUPON",
    secret: coupon.secret,
    source: coupon.source ?? "catalogue",
    series: coupon.series ?? null,
    unlockCondition: coupon.unlockCondition,
    redeemedAt: coupon.redeemedAt,
    scratchable: coupon.type === "challenge" && coupon.status === "available",
  };
}

const statusOrder = {
  available: 0,
  locked: 1,
  undiscovered: 2,
  redeemed: 3,
} as const;

/** Available first, then locked, then undiscovered, then redeemed; stable otherwise. */
export function sortWalletItems(
  items: readonly CouponWalletItem[],
): CouponWalletItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        statusOrder[a.item.status] - statusOrder[b.item.status] ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

/** Deterministic day index for "coupon of the day" (local calendar date). */
export function dayKey(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

export function pickCouponOfTheDay<T extends { readonly id: string }>(
  candidates: readonly T[],
  day: number,
): T | null {
  if (candidates.length === 0) return null;
  // Small integer hash so consecutive days do not walk the list in order.
  let hash = (day * 2654435761) >>> 0;
  hash ^= hash >>> 16;
  return candidates[hash % candidates.length] ?? null;
}

export function getCouponWalletStats(
  coupons: readonly ResolvedCoupon[],
): CouponWalletStats {
  const available = coupons.filter(
    (coupon) => coupon.status === "available",
  ).length;
  const redeemed = coupons.filter(
    (coupon) => coupon.status === "redeemed",
  ).length;
  const locked = coupons.filter((coupon) => coupon.status === "locked").length;
  const undiscovered = coupons.filter(
    (coupon) => coupon.status === "undiscovered",
  ).length;

  return {
    available,
    redeemed,
    locked,
    undiscovered,
    discovered: coupons.length - undiscovered,
    total: coupons.length,
  };
}
