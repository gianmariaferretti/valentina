import { timingSafeEqual } from "node:crypto";

import { loadActivity } from "@/features/admin/repositories/admin-data";
import { runDailyDigest } from "@/features/notifications/notify";
import { formatRome } from "@/features/notifications/lib/email-templates";
import { deliverPending } from "@/features/notifications/repositories/outbox";

/**
 * Vercel Cron, once a day in the evening (vercel.json): retries emails that
 * failed and, if enabled in the panel, sends the day's summary.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export async function GET(request: Request) {
  if (!authorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const retried = await deliverPending(20).catch(() => 0);
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const digest = await runDailyDigest(async () =>
    (await loadActivity(100))
      .filter((item) => new Date(item.at).getTime() > since)
      .reverse()
      .map(
        (item) =>
          `${formatRome(item.at).split(" ")[1] ?? ""} ${item.icon} ${item.text}`,
      ),
  ).catch(() => "failed" as const);
  return Response.json(
    { retried, digest },
    { headers: { "Cache-Control": "no-store" } },
  );
}
