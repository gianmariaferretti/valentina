import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";

import { getAuthSecret, hasValidAccessSession } from "@/lib/auth/session";
import { getSupabaseServerContext } from "@/lib/supabase/server";

const ADMIN_COOKIE = "vg_contract_admin";
const SESSION_SECONDS = 60 * 60;

function configuredPassphrase(): string | null {
  const value = process.env.CONTRACT_ADMIN_PASSPHRASE;
  return value && value.length >= 24 ? value : null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

async function mac(expires: string): Promise<string | null> {
  const authSecret = getAuthSecret();
  const passphrase = configuredPassphrase();
  if (!authSecret || authSecret.length < 32 || !passphrase) return null;
  const accessToken = (await cookies()).get("vg_access")?.value ?? "";
  return createHmac("sha256", authSecret)
    .update(
      `relationship-contract:${accessToken}:${digest(passphrase).toString("hex")}:${expires}`,
    )
    .digest("base64url");
}

export async function hasContractAdminSession(): Promise<boolean> {
  if (!(await hasValidAccessSession())) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [expires, signature, extra] = token.split(".");
  if (
    !expires ||
    !signature ||
    extra ||
    !/^\d{10,12}$/.test(expires) ||
    Number(expires) <= Date.now() / 1000
  )
    return false;
  const expected = await mac(expires);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function tryContractAdminLogin(
  candidate: string,
): Promise<boolean> {
  if (!(await hasValidAccessSession())) return false;
  const passphrase = configuredPassphrase();
  const authSecret = getAuthSecret();
  if (!passphrase || !authSecret || authSecret.length < 32) return false;

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const fingerprint = createHmac("sha256", authSecret)
    .update(`contract-admin:${ip}`)
    .digest("hex");
  const { client } = getSupabaseServerContext();
  const { data: allowed, error } = await client.rpc(
    "register_relationship_admin_attempt",
    { p_fingerprint: fingerprint },
  );
  if (error || !allowed) return false;

  const actual = candidate.length <= 256 ? digest(candidate) : digest("");
  if (!timingSafeEqual(actual, digest(passphrase))) return false;

  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const signature = await mac(expires);
  if (!signature) return false;
  (await cookies()).set(ADMIN_COOKIE, `${expires}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    priority: "high",
    path: "/relationship-contract",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function clearContractAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, "", {
    path: "/relationship-contract",
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}
