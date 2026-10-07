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
      redeemable: true,
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
  return coupon.status === "available" && coupon.redeemable;
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
      type: null,
      status: "undiscovered",
      href: null,
      callToAction: null,
      secret: true,
    };
  }

  const requiresChallenge =
    coupon.type === "challenge" && coupon.status !== "available";

  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    shortDescription: coupon.shortDescription,
    category: coupon.category,
    rarity: coupon.rarity,
    type: coupon.type,
    status: coupon.status,
    href: requiresChallenge
      ? `/challenges/${coupon.challengeId}`
      : `/coupons/${coupon.id}`,
    callToAction: requiresChallenge ? "WIN TO REDEEM" : "VIEW COUPON",
    secret: coupon.secret,
  };
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
