"use server";

import { timingSafeEqual } from "node:crypto";

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
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

export async function verifyAccess(
  previousState: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const expectedCode = getAccessCode();
  const candidate = String(formData.get("code") ?? "").trim();

  if (!expectedCode) {
    return {
      status: "error",
      message: "The private entrance is not configured yet.",
      attempts: previousState.attempts,
    };
  }

  if (!matchesAccessCode(candidate, expectedCode)) {
    return {
      status: "error",
      message:
        rejectionMessages[previousState.attempts % rejectionMessages.length],
      attempts: previousState.attempts + 1,
    };
  }

  await setAccessSession();

  return {
    status: "success",
    message: "Welcome back, amor.",
    attempts: previousState.attempts,
  };
}
