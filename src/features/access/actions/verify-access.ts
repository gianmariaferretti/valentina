"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

import {
  clearAttempts,
  clientFingerprint,
  recordAuthEvent,
  registerAttempt,
} from "@/lib/auth/attempts";
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
  const parsed = z
    .string()
    .max(256)
    .safeParse(formData.get("code") ?? "");
  const candidate = parsed.success ? parsed.data.trim() : "";
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

  // Counted before the code is compared: 5 tries every 15 minutes.
  const fingerprint = await clientFingerprint("visitor");
  if (!(await registerAttempt("visitor", fingerprint))) {
    await recordAuthEvent("visitor", "blocked", fingerprint);
    await delay(450);
    return {
      status: "error",
      message:
        "Too many tries. The door is taking a 15-minute nap — try again later.",
      attempts: attemptCount + 1,
    };
  }

  if (
    !parsed.success ||
    candidate.length > 128 ||
    !matchesAccessCode(candidate, expectedCode)
  ) {
    await recordAuthEvent("visitor", "failed", fingerprint);
    await delay(450);
    return {
      status: "error",
      message: rejectionMessages[attemptCount % rejectionMessages.length],
      attempts: attemptCount + 1,
    };
  }

  await setAccessSession();
  await Promise.all([
    clearAttempts("visitor", fingerprint),
    recordAuthEvent("visitor", "login", fingerprint),
  ]);

  return {
    status: "success",
    message: "Welcome back, amor.",
    attempts: attemptCount,
  };
}
