import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  clearAttempts,
  clientFingerprint,
  recordAuthEvent,
  registerAttempt,
} from "./attempts";
import { MINIMUM_PASSPHRASE_LENGTH } from "./config-check";
import { getRevokedBefore } from "./revocation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminCookieOptions,
  createAdminToken,
  parseAdminToken,
  type SessionToken,
} from "./token";

/**
 * Gianmaria's control panel session. Separate from Valentina's: its own
 * passphrase, cookie (path /admin only), attempt limit and "log out
 * everywhere". CONTRACT_ADMIN_PASSPHRASE keeps working until it is removed.
 */

function configuredPassphrases(): string[] {
  return [process.env.ADMIN_PASSPHRASE, process.env.CONTRACT_ADMIN_PASSPHRASE]
    .filter((value): value is string => Boolean(value))
    .filter((value) => value.length >= MINIMUM_PASSPHRASE_LENGTH)
    .filter((value) => value !== process.env.SITE_ACCESS_CODE);
}

export function isAdminConfigured(): boolean {
  return configuredPassphrases().length > 0;
}

function digest(value: string): Buffer {
  return createHmac("sha256", "vg-admin-passphrase").update(value).digest();
}

function matchesAnyPassphrase(candidate: string): boolean {
  const received = digest(candidate.length <= 256 ? candidate : "");
  let match = false;
  // Compare against every configured passphrase, always, in constant time.
  for (const passphrase of configuredPassphrases())
    match = timingSafeEqual(received, digest(passphrase)) || match;
  return match;
}

export async function readAdminSession(): Promise<SessionToken | null> {
  const session = parseAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) return null;
  if (session.issuedAt < (await getRevokedBefore("admin"))) return null;
  return session;
}

/** Data Access Layer guard for every admin page and action. */
export const requireAdminSession = cache(async (): Promise<SessionToken> => {
  const session = await readAdminSession();
  if (!session) redirect("/admin");
  return session;
});

export type AdminLoginResult = "ok" | "denied" | "blocked" | "unconfigured";

export async function tryAdminLogin(
  candidate: string,
): Promise<AdminLoginResult> {
  if (!isAdminConfigured()) return "unconfigured";
  const fingerprint = await clientFingerprint("admin");
  if (!(await registerAttempt("admin", fingerprint))) {
    await recordAuthEvent("admin", "blocked", fingerprint);
    return "blocked";
  }
  if (!matchesAnyPassphrase(candidate)) {
    await recordAuthEvent("admin", "failed", fingerprint);
    return "denied";
  }
  (await cookies()).set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions());
  await Promise.all([
    clearAttempts("admin", fingerprint),
    recordAuthEvent("admin", "login", fingerprint),
  ]);
  return "ok";
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, "", adminCookieOptions(0));
}

export { ADMIN_SESSION_SECONDS };
