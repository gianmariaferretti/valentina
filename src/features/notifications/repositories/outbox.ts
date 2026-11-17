import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServerContext } from "@/lib/supabase/server";
import { loadSetting } from "@/features/admin/repositories/content";

import type { RenderedEmail } from "../lib/email-templates";
import { getNotifier } from "../lib/notifier";
import {
  DAILY_EMAIL_CAP,
  MAX_ATTEMPTS,
  parseNotificationSettings,
  type NotificationSettings,
} from "../lib/settings";

export type NotificationKind =
  "coupon_redeemed" | "miss_you" | "digest" | "test";

export type DeliveryStatus =
  "sent" | "failed" | "pending" | "capped" | "disabled";

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  return parseNotificationSettings(await loadSetting("notifications"));
}

function startOfUtcDay(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function emailsSentToday(): Promise<number> {
  const { client } = getSupabaseServerContext();
  const { count, error } = await client
    .from("notification_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfUtcDay());
  if (error) throw error;
  return count ?? 0;
}

interface OutboxRow {
  id: string;
  payload: Json;
  subject: string;
  attempts: number;
}

/** Sends one queued email. Never throws: the outcome is saved on the row. */
async function deliver(row: OutboxRow): Promise<DeliveryStatus> {
  const { client } = getSupabaseServerContext();
  const notifier = getNotifier();
  if (!notifier) return "pending";
  if ((await emailsSentToday()) >= DAILY_EMAIL_CAP) return "capped";
  const payload = (row.payload ?? {}) as {
    email?: { html?: string; text?: string };
  };
  try {
    const providerId = await notifier.send(
      {
        subject: row.subject,
        html: payload.email?.html ?? row.subject,
        text: payload.email?.text ?? row.subject,
      },
      row.id,
    );
    await client
      .from("notification_outbox")
      .update({
        status: "sent",
        attempts: row.attempts + 1,
        provider_id: providerId.slice(0, 200),
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id);
    return "sent";
  } catch (error) {
    await client
      .from("notification_outbox")
      .update({
        status: "failed",
        attempts: row.attempts + 1,
        last_error: String(
          error instanceof Error ? error.message : error,
        ).slice(0, 500),
      })
      .eq("id", row.id);
    return "failed";
  }
}

/**
 * Queues an email and tries to send it now. The row is saved first, so a
 * failure (or the daily cap) leaves it pending for a later retry.
 */
export async function queueEmail(
  kind: NotificationKind,
  email: RenderedEmail,
  payload: Record<string, unknown> = {},
): Promise<{ id: string; status: DeliveryStatus }> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("notification_outbox")
    .insert({
      kind,
      subject: email.subject.slice(0, 200),
      payload: {
        ...payload,
        email: { html: email.html, text: email.text },
      } as Json,
    })
    .select("id, payload, subject, attempts")
    .single();
  if (error) throw error;
  return { id: data.id, status: await deliver(data) };
}

/** Retries what is still pending or failed (recent, not too many attempts). */
export async function deliverPending(limit = 10): Promise<number> {
  const { client } = getSupabaseServerContext();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("notification_outbox")
    .select("id, payload, subject, attempts")
    .neq("status", "sent")
    .lt("attempts", MAX_ATTEMPTS)
    .gte("created_at", since)
    .order("created_at")
    .limit(limit);
  if (error) throw error;
  let sent = 0;
  for (const row of data ?? []) {
    const status = await deliver(row);
    if (status === "sent") sent++;
    if (status === "capped" || status === "pending") break;
  }
  return sent;
}

export interface OutboxEntry {
  id: string;
  kind: string;
  subject: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export async function loadOutbox(limit = 40): Promise<OutboxEntry[]> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("notification_outbox")
    .select(
      "id, kind, subject, status, attempts, last_error, created_at, sent_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
