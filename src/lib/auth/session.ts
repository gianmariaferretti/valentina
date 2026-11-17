import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getRevokedBefore } from "./revocation";
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  createAccessToken,
  parseAccessToken,
  type SessionToken,
} from "./token";

export { getAuthSecret } from "./token";

/** Signature, expiry and "logged out everywhere" all checked. */
export async function readAccessSession(): Promise<SessionToken | null> {
  const cookieStore = await cookies();
  const session = parseAccessToken(cookieStore.get(ACCESS_COOKIE)?.value);
  if (!session) return null;
  if (session.issuedAt < (await getRevokedBefore("visitor"))) return null;
  return session;
}

export async function hasValidAccessSession(): Promise<boolean> {
  return (await readAccessSession()) !== null;
}

/**
 * Data Access Layer guard: every page and every loader of private data calls
 * it. Deduplicated within one render; redirects to the entrance otherwise.
 */
export const requireAccessSession = cache(async (): Promise<SessionToken> => {
  const session = await readAccessSession();
  if (!session) redirect("/access");
  return session;
});

export async function setAccessSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, createAccessToken(), accessCookieOptions());
}

export async function clearAccessSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", accessCookieOptions(0));
}
