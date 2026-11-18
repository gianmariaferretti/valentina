import "server-only";

import { getSupabaseServerContext } from "@/lib/supabase/server";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import { siteOrigin } from "./lib/action-token";
import {
  couponRedeemedEmail,
  digestEmail,
  doodleEmail,
  missYouEmail,
  testEmail,
} from "./lib/email-templates";
import { MISS_YOU_GAP_SECONDS } from "./lib/settings";
import { createActionLink } from "./repositories/action-tokens";
import {
  deliverPending,
  loadNotificationSettings,
  queueEmail,
  type DeliveryStatus,
} from "./repositories/outbox";

/**
 * Valentina redeemed a coupon: email Gianmaria with a "Consegnato" button.
 * Never throws; the redemption is already saved before this runs.
 */
export async function notifyCouponRedeemed(coupon: {
  id: string;
  title: string;
  setting: "together" | "apart";
  rarity: string;
  redeemedAt: string;
}): Promise<DeliveryStatus> {
  try {
    const settings = await loadNotificationSettings();
    if (!settings.couponRedeemed) return "disabled";
    // Old failures go first, so nothing is lost.
    await deliverPending(5).catch(() => 0);
    const deliverUrl = await createActionLink({
      action: "deliver",
      payload: { couponId: coupon.id, title: coupon.title },
    });
    const result = await queueEmail(
      "coupon_redeemed",
      couponRedeemedEmail({ ...coupon, deliverUrl }),
      { couponId: coupon.id },
    );
    return result.status;
  } catch (error) {
    reportPersistenceFailure("notify coupon redeemed", error);
    return "failed";
  }
}

/** Valentina sent a doodle. Never throws: the doodle is already saved. */
export async function notifyDoodle(doodleId: string): Promise<DeliveryStatus> {
  try {
    await deliverPending(5).catch(() => 0);
    const result = await queueEmail(
      "doodle",
      doodleEmail({ panelUrl: `${siteOrigin()}/admin/disegni` }),
      { doodleId },
    );
    return result.status;
  } catch (error) {
    reportPersistenceFailure("notify doodle", error);
    return "failed";
  }
}

/** One tap of "Miss you". Emails at most every 10 minutes, bundling taps. */
export async function recordMissYou(): Promise<{
  emailed: number;
  status: DeliveryStatus | "waiting";
}> {
  const { client } = getSupabaseServerContext();
  const { error } = await client.from("miss_you_taps").insert({});
  if (error) throw error;
  const settings = await loadNotificationSettings();
  if (!settings.missYou) return { emailed: 0, status: "disabled" };
  const { data: taps, error: claimError } = await client.rpc(
    "claim_miss_you_taps",
    { p_gap_seconds: MISS_YOU_GAP_SECONDS },
  );
  if (claimError) throw claimError;
  if (!taps) return { emailed: 0, status: "waiting" };
  const heartUrl = await createActionLink({ action: "heart", payload: {} });
  const result = await queueEmail(
    "miss_you",
    missYouEmail({ taps, heartUrl, callUrl: settings.callLink || null }),
    { taps },
  );
  return { emailed: taps, status: result.status };
}

export async function sendHeart(
  message: string | null,
  source: "panel" | "email",
): Promise<void> {
  const { client } = getSupabaseServerContext();
  const { error } = await client
    .from("hearts")
    .insert({ message: message?.trim() || null, source });
  if (error) throw error;
}

export async function sendTestEmail(): Promise<DeliveryStatus> {
  const result = await queueEmail("test", testEmail(`${siteOrigin()}/admin`));
  return result.status;
}

/** Evening summary (Vercel Cron). Off unless enabled in the panel. */
export async function runDailyDigest(
  lines: () => Promise<string[]>,
): Promise<DeliveryStatus> {
  const settings = await loadNotificationSettings();
  await deliverPending(10).catch(() => 0);
  if (!settings.digest) return "disabled";
  const date = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome",
  }).format(new Date());
  const result = await queueEmail(
    "digest",
    digestEmail({ date, lines: await lines() }),
  );
  return result.status;
}
