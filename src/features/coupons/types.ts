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

/** Together = in person; Apart = long-distance. */
export const couponSettings = ["together", "apart"] as const;

/** Where a coupon comes from: the fixed catalogue or a Kiss Casino win. */
export const couponSources = ["catalogue", "casino"] as const;

export const couponStatuses = [
  "available",
  "redeemed",
  "locked",
  "undiscovered",
] as const;

export type CouponCategory = (typeof couponCategories)[number];
export type CouponRarity = (typeof couponRarities)[number];
export type CouponStatus = (typeof couponStatuses)[number];
export type CouponSetting = (typeof couponSettings)[number];
export type CouponSource = (typeof couponSources)[number];
export type CouponType = "standard" | "challenge";

/** One ticket in a numbered run of identical coupons ("2 of 3"). */
export interface CouponSeries {
  readonly index: number;
  readonly total: number;
}

export interface Coupon {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly category: CouponCategory;
  readonly rarity: CouponRarity;
  readonly setting: CouponSetting;
  readonly type: CouponType;
  readonly status: CouponStatus;
  /** Defaults to "catalogue". */
  readonly source?: CouponSource;
  readonly series?: CouponSeries;
  /**
   * Retired duplicates stay in the data so saved redemptions keep resolving.
   * They are hidden from the wallet unless already redeemed, and cannot be redeemed.
   */
  readonly retired?: boolean;
  readonly redeemable: boolean;
  /** Reward may be discovered before its owner supplies actual prize terms. */
  readonly fulfillmentReady?: boolean;
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
  readonly unlockedCouponIds: readonly string[];
}

export interface ResolvedCoupon extends Omit<
  Coupon,
  "status" | "redeemable" | "redeemedAt"
> {
  readonly status: CouponStatus;
  readonly redeemable: boolean;
  readonly redeemedAt: string | null;
}

export interface CouponWalletItem {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly category: CouponCategory | null;
  readonly rarity: CouponRarity | null;
  readonly setting: CouponSetting;
  readonly type: CouponType | null;
  readonly status: CouponStatus;
  readonly href: string | null;
  readonly callToAction: string | null;
  readonly secret: boolean;
  readonly source: CouponSource;
  readonly series: CouponSeries | null;
  readonly unlockCondition: string | null;
  readonly redeemedAt: string | null;
  /** A challenge prize that was won and can be scratched open for the first time. */
  readonly scratchable: boolean;
  /** Can be redeemed right now (also from the wallet). */
  readonly redeemable: boolean;
}

export interface CouponWalletStats {
  readonly available: number;
  readonly redeemed: number;
  readonly locked: number;
  readonly undiscovered: number;
  readonly discovered: number;
  readonly total: number;
}

export type CouponFilter = "all" | "album" | CouponCategory | CouponRarity;

export const EMPTY_COUPON_WALLET_STATE: CouponWalletState = {
  version: 1,
  redemptions: [],
  unlockedCouponIds: [],
};
