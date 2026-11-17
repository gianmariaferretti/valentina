import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  EMAIL_ACTION_DAYS,
  newNonce,
  signActionToken,
  siteOrigin,
  verifyActionToken,
} from "../lib/action-token";

export type EmailAction =
  | { action: "deliver"; payload: { couponId: string; title: string } }
  | { action: "heart"; payload: Record<string, never> };

/** A one-time, 7-day link to a confirmation page for this action. */
export async function createActionLink(
  action: EmailAction,
): Promise<string | null> {
  const secret = process.env.EMAIL_ACTION_SECRET;
  if (!secret || secret.length < 32) return null;
  const nonce = newNonce();
  const expires =
    Math.floor(Date.now() / 1000) + EMAIL_ACTION_DAYS * 24 * 60 * 60;
  const { client } = getSupabaseServerContext();
  const { error } = await client.from("email_action_tokens").insert({
    nonce,
    action: action.action,
    payload: action.payload as Json,
    expires_at: new Date(expires * 1000).toISOString(),
  });
  if (error) throw error;
  return `${siteOrigin()}/action/${signActionToken(secret, nonce, expires)}`;
}

/** Reads a link without using it (for the confirmation page). */
export async function peekActionToken(
  token: string,
): Promise<EmailAction | "used" | null> {
  const verified = verifyActionToken(
    process.env.EMAIL_ACTION_SECRET,
    token,
    Math.floor(Date.now() / 1000),
  );
  if (!verified) return null;
  const { client } = getSupabaseServerContext();
  const { data } = await client
    .from("email_action_tokens")
    .select("action, payload, used_at")
    .eq("nonce", verified.nonce)
    .maybeSingle();
  if (!data) return null;
  if (data.used_at) return "used";
  return { action: data.action, payload: data.payload } as EmailAction;
}

/** Uses a link exactly once (atomic in the database). */
export async function consumeActionToken(
  token: string,
): Promise<EmailAction | null> {
  const verified = verifyActionToken(
    process.env.EMAIL_ACTION_SECRET,
    token,
    Math.floor(Date.now() / 1000),
  );
  if (!verified) return null;
  const { client } = getSupabaseServerContext();
  const { data, error } = await client.rpc("use_email_action_token", {
    p_nonce: verified.nonce,
  });
  if (error || !data?.[0]) return null;
  return { action: data[0].action, payload: data[0].payload } as EmailAction;
}
