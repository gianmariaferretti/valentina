"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { setAccessSession } from "@/lib/auth/session";

export interface AccessActionState {
  status: "idle" | "error" | "success";
  message?: string;
  attempts: number;
}

function getAccessCode(): string | null {
  return process.env.SITE_ACCESS_CODE ?? null;
}

const rejectionMessages = [
  "That’s awkward.",
  "Valentina, seriously?",
  "Should I call Gianmaria?",
  "Identity verification failed. Girlfriend status under review.",
] as const;

function matchesAccessCode(candidate: string, expected: string): boolean {
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export async function verifyAccess(
  previousState: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const expectedCode = getAccessCode();
  const candidate = String(formData.get("code") ?? "").trim();
  const attemptCount = Number.isSafeInteger(previousState.attempts)
    ? Math.max(0, Math.min(previousState.attempts, 10_000))
    : 0;

  if (!expectedCode) {
    return {
      status: "error",
      message: "The private entrance is not configured yet.",
      attempts: attemptCount,
    };
  }

  if (candidate.length > 128 || !matchesAccessCode(candidate, expectedCode)) {
    await delay(450);
    return {
      status: "error",
      message: rejectionMessages[attemptCount % rejectionMessages.length],
      attempts: attemptCount + 1,
    };
  }

  await setAccessSession();

  return {
    status: "success",
    message: "Welcome back, amor.",
    attempts: attemptCount,
  };
}
