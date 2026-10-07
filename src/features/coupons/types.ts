export const couponCategories = [
  "dates",
  "food",
  "romantic",
  "emergency",
] as const;

export const couponRarities = [
  "standard",
  "premium",
  "legendary",
  "impossible",
] as const;

export const couponStatuses = [
  "available",
  "redeemed",
  "locked",
  "undiscovered",
] as const;

export type CouponCategory = (typeof couponCategories)[number];
export type CouponRarity = (typeof couponRarities)[number];
export type CouponStatus = (typeof couponStatuses)[number];
export type CouponType = "standard" | "challenge";

export interface Coupon {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly category: CouponCategory;
  readonly rarity: CouponRarity;
  readonly type: CouponType;
  readonly status: CouponStatus;
  readonly redeemable: boolean;
  readonly challengeId: string | null;
  readonly unlockCondition: string | null;
  readonly secret: boolean;
  readonly createdAt: string;
  readonly redeemedAt: string | null;
  readonly terms: readonly string[];
}

export interface CouponRedemption {
  readonly couponId: string;
  readonly redeemedAt: string;
}

export interface CouponWalletState {
  readonly version: 1;
  readonly redemptions: readonly CouponRedemption[];
}

export interface ResolvedCoupon extends Omit<Coupon, "status" | "redeemedAt"> {
  readonly status: CouponStatus;
  readonly redeemedAt: string | null;
}

export interface CouponWalletItem {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly category: CouponCategory | null;
  readonly rarity: CouponRarity | null;
  readonly type: CouponType | null;
  readonly status: CouponStatus;
  readonly href: string | null;
  readonly callToAction: string | null;
  readonly secret: boolean;
}

export interface CouponWalletStats {
  readonly available: number;
  readonly redeemed: number;
  readonly locked: number;
  readonly undiscovered: number;
  readonly discovered: number;
  readonly total: number;
}

export type CouponFilter =
  "all" | CouponCategory | Exclude<CouponRarity, "standard">;

export const EMPTY_COUPON_WALLET_STATE: CouponWalletState = {
  version: 1,
  redemptions: [],
};
