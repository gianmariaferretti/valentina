"use server";

import { timingSafeEqual } from "node:crypto";

import { redirect } from "next/navigation";

import { setAccessSession } from "@/lib/auth/session";

export interface AccessActionState {
  status: "idle" | "error";
  message?: string;
}

function getAccessCode(): string | null {
  if (process.env.SITE_ACCESS_CODE) return process.env.SITE_ACCESS_CODE;
  if (process.env.NODE_ENV !== "production") return "041025";

  return null;
}

function matchesAccessCode(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

export async function verifyAccess(
  _previousState: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const expectedCode = getAccessCode();
  const candidate = String(formData.get("code") ?? "").trim();

  if (!expectedCode) {
    return {
      status: "error",
      message: "The private entrance is not configured yet.",
    };
  }

  if (!matchesAccessCode(candidate, expectedCode)) {
    return {
      status: "error",
      message: "That is not it. This is already a little embarrassing.",
    };
  }

  await setAccessSession();
  redirect("/home");
}
