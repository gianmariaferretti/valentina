import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const ACCESS_COOKIE = "vg_access";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 365;

function getAuthSecret(): string | null {
  const configuredSecret = process.env.AUTH_SECRET;

  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV !== "production")
    return "vg-local-development-secret";

  return null;
}

function sign(expiresAt: string, secret: string): string {
  return createHmac("sha256", secret).update(expiresAt).digest("base64url");
}

export function createAccessToken(): string {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured in production.");
  }

  const expiresAt = String(
    Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  );

  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyAccessToken(token: string | undefined): boolean {
  const secret = getAuthSecret();
  if (!secret || !token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now() / 1000) {
    return false;
  }

  const expected = Buffer.from(sign(expiresAt, secret));
  const received = Buffer.from(signature);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function hasValidAccessSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAccessToken(cookieStore.get(ACCESS_COOKIE)?.value);
}

export async function setAccessSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, createAccessToken(), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}
