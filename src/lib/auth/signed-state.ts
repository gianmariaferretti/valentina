import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getAuthSecret } from "@/lib/auth/session";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeSignedState(value: unknown): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET must be configured in production.");

  const payload = Buffer.from(JSON.stringify(value), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeSignedState(value: string | undefined): unknown | null {
  const secret = getAuthSecret();
  if (!value || !secret) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
