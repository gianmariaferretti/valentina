/**
 * Signed links in emails: `<nonce>.<expires>.<hmac>` with EMAIL_ACTION_SECRET.
 * The signature proves the link came from the site; the nonce row in
 * Supabase makes it single-use. Pure helpers, testable without a database.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const EMAIL_ACTION_DAYS = 7;
export const MINIMUM_EMAIL_SECRET_LENGTH = 32;

function signature(secret: string, nonce: string, expires: number): string {
  return createHmac("sha256", secret)
    .update(`email-action:${nonce}.${expires}`)
    .digest("base64url");
}

export function newNonce(): string {
  return randomBytes(18).toString("base64url");
}

export function signActionToken(
  secret: string,
  nonce: string,
  expires: number,
): string {
  return `${nonce}.${expires}.${signature(secret, nonce, expires)}`;
}

export function verifyActionToken(
  secret: string | undefined,
  token: string,
  nowSeconds: number,
): { nonce: string; expires: number } | null {
  if (!secret || secret.length < MINIMUM_EMAIL_SECRET_LENGTH) return null;
  if (typeof token !== "string" || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [nonce, expiresText, sig] = parts;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(nonce) || !/^\d{10,12}$/.test(expiresText))
    return null;
  const expires = Number(expiresText);
  if (expires <= nowSeconds) return null;
  const expected = Buffer.from(signature(secret, nonce, expires));
  const received = Buffer.from(sig ?? "");
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return null;
  return { nonce, expires };
}

/** Public origin for links in emails (cron jobs have no request). */
export function siteOrigin(): string {
  const explicit = process.env.SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
