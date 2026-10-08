import "server-only";

import type { CouponStateRepository } from "@/features/coupons/repositories/coupon-state-repository";
import type { CouponWalletState } from "@/features/coupons/types";
import { PersistenceError } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

export class SupabaseCouponStateRepository implements CouponStateRepository {
  async get(): Promise<CouponWalletState> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("coupon_state")
      .select("coupon_id, unlocked_at, redeemed_at")
      .eq("user_id", userId);

    assertSupabaseResult("Unable to load coupon state.", error);

    return {
      version: 1,
      redemptions: (data ?? []).flatMap((row) =>
        row.redeemed_at
          ? [{ couponId: row.coupon_id, redeemedAt: row.redeemed_at }]
          : [],
      ),
      unlockedCouponIds: (data ?? [])
        .filter((row) => row.unlocked_at !== null)
        .map((row) => row.coupon_id),
    };
  }

  async redeem(couponId: string, redeemedAt: string): Promise<string> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("redeem_coupon_state", {
      p_user_id: userId,
      p_coupon_id: couponId,
      p_redeemed_at: redeemedAt,
    });

    assertSupabaseResult("Unable to redeem coupon.", error);
    const saved = data?.[0]?.redeemed_at;
    if (!saved) throw new PersistenceError("Coupon redemption was not saved.");
    return saved;
  }
}
