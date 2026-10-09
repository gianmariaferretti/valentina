import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/auth/session";
import { archiveStages, type ArchiveProof } from "./archive-domain";

const COOKIE = "vg_spicy_archive";

async function signature(payload: string): Promise<string> {
  const secret = getAuthSecret();
  if (!secret) throw new Error("Archive session unavailable.");
  const access = (await cookies()).get("vg_access")?.value ?? "";
  return createHmac("sha256", secret)
    .update(`spicy-archive:${access}:${payload}`)
    .digest("base64url");
}

export async function readArchiveProof(): Promise<ArchiveProof | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) return null;
  const expected = Buffer.from(await signature(payload));
  const received = Buffer.from(supplied);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return null;
  try {
    const proof: ArchiveProof = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (!archiveStages.includes(proof.stage) || proof.expiresAt <= Date.now())
      return null;
    return proof;
  } catch {
    return null;
  }
}

export async function writeArchiveProof(proof: ArchiveProof): Promise<void> {
  const payload = Buffer.from(JSON.stringify(proof)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${await signature(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearArchiveProof(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
