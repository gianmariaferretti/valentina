import "server-only";

import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { getSupabaseServerContext } from "@/lib/supabase/server";

import { getAuthSecret, isProduction } from "./token";

export type AttemptScope = "visitor" | "admin" | "contract";

/** 5 attempts every 15 minutes per device, as for the contract desk. */
export const ATTEMPT_LIMIT = 5;
export const ATTEMPT_WINDOW_SECONDS = 15 * 60;
/**
 * Site-wide ceiling, whatever the IP says: stops someone rotating addresses
 * (or forging X-Forwarded-For off Vercel). Worst case it pauses logins for
 * 15 minutes.
 */
export const GLOBAL_ATTEMPT_LIMIT = 30;

async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function clientFingerprint(scope: AttemptScope): Promise<string> {
  const secret = getAuthSecret() ?? "unconfigured";
  return createHmac("sha256", secret)
    .update(`${scope}:${await clientIp()}`)
    .digest("hex")
    .slice(0, 32);
}

export async function userAgentSummary(): Promise<string> {
  const ua = (await headers()).get("user-agent") ?? "";
  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /CriOS|Chrome\//.test(ua)
      ? "Chrome"
      : /FxiOS|Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${device} · ${browser}`;
}

/**
 * Counts an attempt before the secret is compared. Answers false when the
 * device or the whole site is over its limit. Without Supabase: allowed in
 * development, refused in production (fail closed).
 */
export async function registerAttempt(
  scope: AttemptScope,
  fingerprint: string,
): Promise<boolean> {
  let context;
  try {
    context = getSupabaseServerContext();
  } catch {
    return !isProduction();
  }
  const { client } = context;
  const [device, site] = await Promise.all([
    client.rpc("register_auth_attempt", {
      p_scope: scope,
      p_fingerprint: fingerprint,
      p_limit: ATTEMPT_LIMIT,
      p_window_seconds: ATTEMPT_WINDOW_SECONDS,
    }),
    client.rpc("register_auth_attempt", {
      p_scope: scope,
      p_fingerprint: "global",
      p_limit: GLOBAL_ATTEMPT_LIMIT,
      p_window_seconds: ATTEMPT_WINDOW_SECONDS,
    }),
  ]);
  if (device.error || site.error) return !isProduction();
  return Boolean(device.data) && Boolean(site.data);
}

export async function clearAttempts(
  scope: AttemptScope,
  fingerprint: string,
): Promise<void> {
  try {
    const { client } = getSupabaseServerContext();
    await client.rpc("clear_auth_attempts", {
      p_scope: scope,
      p_fingerprint: fingerprint,
    });
  } catch {
    // Best effort: the window expires on its own.
  }
}

export async function recordAuthEvent(
  scope: AttemptScope,
  kind: "login" | "failed" | "blocked",
  fingerprint: string,
): Promise<void> {
  try {
    const { client } = getSupabaseServerContext();
    await client.rpc("record_auth_event", {
      p_scope: scope,
      p_kind: kind,
      p_fingerprint: fingerprint,
      p_detail: await userAgentSummary(),
    });
  } catch {
    // The log is informative only; never block a login on it.
  }
}
