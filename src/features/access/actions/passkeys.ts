"use server";

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { headers } from "next/headers";
import { setTimeout as delay } from "node:timers/promises";

import {
  clearAttempts,
  clientFingerprint,
  recordAuthEvent,
  registerAttempt,
} from "@/lib/auth/attempts";
import {
  loginOptions,
  PasskeysNotReady,
  registerPasskey,
  registrationOptions,
  verifyPasskeyLogin,
} from "@/lib/auth/passkey-server";
import { deviceLabel } from "@/lib/auth/passkeys";
import { hasValidAccessSession, setAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const NOT_READY = "Face ID isn't switched on yet. Use the code for now.";

function failure(error: unknown, what: string): { ok: false; message: string } {
  if (error instanceof PasskeysNotReady)
    return { ok: false, message: NOT_READY };
  reportPersistenceFailure(what, error);
  return { ok: false, message: "Something went wrong. Use the code for now." };
}

/** Step 1 of "Unlock with Face ID next time?" (only once logged in). */
export async function startPasskeySetup(): Promise<
  Result<PublicKeyCredentialCreationOptionsJSON>
> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Log in with the code first." };
  try {
    return { ok: true, value: await registrationOptions("visitor") };
  } catch (error) {
    return failure(error, "passkey setup options");
  }
}

/** Step 2: the device made its passkey; keep the public half. */
export async function finishPasskeySetup(
  response: RegistrationResponseJSON,
): Promise<Result<null>> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Log in with the code first." };
  try {
    const device = deviceLabel((await headers()).get("user-agent") ?? "");
    if (!(await registerPasskey(response, device, "visitor")))
      return { ok: false, message: "That didn't work. Try again?" };
    return { ok: true, value: null };
  } catch (error) {
    return failure(error, "passkey setup");
  }
}

/** Step 1 of "Unlock with Face ID" on /access (no session yet). */
export async function startPasskeyLogin(): Promise<
  Result<PublicKeyCredentialRequestOptionsJSON>
> {
  try {
    return { ok: true, value: await loginOptions("visitor") };
  } catch (error) {
    return failure(error, "passkey login options");
  }
}

/**
 * Step 2: verify and open the archive. Counts against the same limit as
 * the access code (5 tries every 15 minutes per device).
 */
export async function finishPasskeyLogin(
  response: AuthenticationResponseJSON,
): Promise<Result<null>> {
  const fingerprint = await clientFingerprint("visitor");
  if (!(await registerAttempt("visitor", fingerprint))) {
    await recordAuthEvent("visitor", "blocked", fingerprint);
    await delay(450);
    return {
      ok: false,
      message:
        "Too many tries. The door is taking a 15-minute nap — try again later.",
    };
  }
  let verified = false;
  try {
    verified = await verifyPasskeyLogin(response, "visitor");
  } catch (error) {
    return failure(error, "passkey login");
  }
  if (!verified) {
    await recordAuthEvent("visitor", "failed", fingerprint);
    await delay(450);
    return {
      ok: false,
      message: "Face ID said no. Use the code, or try again.",
    };
  }
  await setAccessSession();
  await Promise.all([
    clearAttempts("visitor", fingerprint),
    recordAuthEvent("visitor", "login", fingerprint),
  ]);
  return { ok: true, value: null };
}
