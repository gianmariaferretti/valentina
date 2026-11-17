/**
 * Signed session tokens, shared by the proxy and the server.
 *
 * Format: `v2.<issuedAt>.<expiresAt>.<signature>` (Unix seconds, HMAC-SHA256
 * with AUTH_SECRET). `issuedAt` is the moment of login and never changes when
 * the session is renewed, so "log out of every device" can reject every token
 * issued before a given instant. This module has no `server-only` marker so
 * the proxy can use it; it only runs on the server.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "vg_access";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
/** A session is renewed (new 30 days) at most once a day while it is used. */
export const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24;
export const MINIMUM_AUTH_SECRET_LENGTH = 32;

const LOCAL_DEVELOPMENT_SECRET =
  "vg-local-development-secret-not-for-production";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAuthSecret(): string | null {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= MINIMUM_AUTH_SECRET_LENGTH)
    return configured;
  if (!isProduction()) return configured || LOCAL_DEVELOPMENT_SECRET;
  return null;
}

export interface SessionToken {
  issuedAt: number;
  expiresAt: number;
}

function sign(payload: string, secret: string, purpose: string): string {
  return createHmac("sha256", secret)
    .update(`${purpose}:${payload}`)
    .digest("base64url");
}

export function createSessionToken(
  secret: string,
  purpose: string,
  durationSeconds: number,
  issuedAt: number,
  now: number,
): string {
  const payload = `v2.${issuedAt}.${now + durationSeconds}`;
  return `${payload}.${sign(payload, secret, purpose)}`;
}

export function parseSessionToken(
  token: string | undefined,
  secret: string | null,
  purpose: string,
  now: number,
): SessionToken | null {
  if (!secret || !token || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v2") return null;
  const [, issued, expires, signature] = parts;
  if (!/^\d{10,12}$/.test(issued) || !/^\d{10,12}$/.test(expires)) return null;
  const issuedAt = Number(issued);
  const expiresAt = Number(expires);
  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    issuedAt > now + 60
  )
    return null;
  const expected = Buffer.from(
    sign(`v2.${issued}.${expires}`, secret, purpose),
  );
  const received = Buffer.from(signature ?? "");
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return null;
  return { issuedAt, expiresAt };
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Valentina's access session. */
export const VISITOR_PURPOSE = "vg-access";

export function createAccessToken(issuedAt?: number): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET must be configured in production.");
  const now = nowSeconds();
  return createSessionToken(
    secret,
    VISITOR_PURPOSE,
    SESSION_DURATION_SECONDS,
    issuedAt ?? now,
    now,
  );
}

export function parseAccessToken(
  token: string | undefined,
  now = nowSeconds(),
): SessionToken | null {
  return parseSessionToken(token, getAuthSecret(), VISITOR_PURPOSE, now);
}

/** True once a day: the cookie gets a fresh 30 days, same login time. */
export function shouldRenew(
  session: SessionToken,
  now = nowSeconds(),
): boolean {
  return (
    session.expiresAt - now <
    SESSION_DURATION_SECONDS - SESSION_RENEW_AFTER_SECONDS
  );
}

export function accessCookieOptions(maxAge = SESSION_DURATION_SECONDS) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    priority: "high" as const,
    sameSite: "strict" as const,
    secure: isProduction(),
  };
}

/** Gianmaria's control panel session: 7 days, renewed daily while used. */
export const ADMIN_COOKIE = "vg_admin";
export const ADMIN_PURPOSE = "vg-admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;

export function createAdminToken(issuedAt?: number): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET must be configured in production.");
  const now = nowSeconds();
  return createSessionToken(
    secret,
    ADMIN_PURPOSE,
    ADMIN_SESSION_SECONDS,
    issuedAt ?? now,
    now,
  );
}

export function parseAdminToken(
  token: string | undefined,
  now = nowSeconds(),
): SessionToken | null {
  return parseSessionToken(token, getAuthSecret(), ADMIN_PURPOSE, now);
}

export function shouldRenewAdmin(
  session: SessionToken,
  now = nowSeconds(),
): boolean {
  return (
    session.expiresAt - now <
    ADMIN_SESSION_SECONDS - SESSION_RENEW_AFTER_SECONDS
  );
}

export function adminCookieOptions(maxAge = ADMIN_SESSION_SECONDS) {
  return {
    httpOnly: true,
    maxAge,
    path: "/admin",
    priority: "high" as const,
    sameSite: "strict" as const,
    secure: isProduction(),
  };
}
