import "server-only";

import type {
  CouponStateRepository,
  CouponUnlockInput,
} from "@/features/coupons/repositories/coupon-state-repository";
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

  async unlock(input: CouponUnlockInput): Promise<boolean> {
    const { client, userId } = getSupabaseServerContext();
    const { data: existing, error: existingError } = await client
      .from("coupon_state")
      .select("unlocked_at")
      .eq("user_id", userId)
      .eq("coupon_id", input.couponId)
      .maybeSingle();

    assertSupabaseResult("Unable to inspect coupon state.", existingError);

    const { error: couponError } = await client.from("coupon_state").upsert(
      {
        user_id: userId,
        coupon_id: input.couponId,
        unlocked_at: existing?.unlocked_at ?? input.discoveredAt,
      },
      { onConflict: "user_id,coupon_id" },
    );
    assertSupabaseResult("Unable to unlock coupon.", couponError);

    const { error: discoveryError } = await client.from("discoveries").upsert(
      [
        {
          user_id: userId,
          discovery_id: input.discoveryId,
          discovery_type: "reward",
          source: input.source,
          discovered_at: input.discoveredAt,
        },
        {
          user_id: userId,
          discovery_id: `coupon:${input.couponId}`,
          discovery_type: "coupon",
          source: input.source,
          discovered_at: input.discoveredAt,
        },
      ],
      { onConflict: "user_id,discovery_id", ignoreDuplicates: true },
    );
    assertSupabaseResult("Unable to record coupon discovery.", discoveryError);

    return existing?.unlocked_at === null || !existing;
  }
}
