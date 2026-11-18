"use client";

import {
  finishPasskeyLogin,
  finishPasskeySetup,
  startPasskeyLogin,
  startPasskeySetup,
} from "../actions/passkeys";

/**
 * Browser side of passkeys (@simplewebauthn/browser, MIT), loaded only
 * when a passkey button is tapped.
 */

export type PasskeyOutcome = { ok: true } | { ok: false; message: string };

/** "Face ID", "Touch ID", "fingerprint"… for the button label. */
export function biometricName(userAgent: string): string {
  if (/iPhone|iPad/.test(userAgent)) return "Face ID";
  if (/Macintosh/.test(userAgent)) return "Touch ID";
  if (/Android/.test(userAgent)) return "fingerprint";
  if (/Windows/.test(userAgent)) return "Windows Hello";
  return "a passkey";
}

/** True when this device can make and use a passkey with its own lock. */
export async function canUsePasskeys(): Promise<boolean> {
  try {
    const browser = await import("@simplewebauthn/browser");
    return (
      browser.browserSupportsWebAuthn() &&
      (await browser.platformAuthenticatorIsAvailable())
    );
  } catch {
    return false;
  }
}

function cancelled(error: unknown): string | null {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "AbortError")
    return "Cancelled. No problem.";
  if (name === "InvalidStateError")
    return "This device is already set up. Use it on the entrance.";
  return null;
}

export async function setUpPasskey(): Promise<PasskeyOutcome> {
  const options = await startPasskeySetup();
  if (!options.ok) return options;
  try {
    const { startRegistration } = await import("@simplewebauthn/browser");
    const response = await startRegistration({ optionsJSON: options.value });
    const saved = await finishPasskeySetup(response);
    return saved.ok ? { ok: true } : saved;
  } catch (error) {
    return {
      ok: false,
      message: cancelled(error) ?? "That didn't work. Try again?",
    };
  }
}

export async function unlockWithPasskey(): Promise<PasskeyOutcome> {
  const options = await startPasskeyLogin();
  if (!options.ok) return options;
  try {
    const { startAuthentication } = await import("@simplewebauthn/browser");
    const response = await startAuthentication({ optionsJSON: options.value });
    const result = await finishPasskeyLogin(response);
    return result.ok ? { ok: true } : result;
  } catch (error) {
    return {
      ok: false,
      message: cancelled(error) ?? "Face ID said no. Use the code instead.",
    };
  }
}

export const PASSKEY_OFFERED_KEY = "vg.passkey.offered";

/** Set when the code form is sent; read once by the offer on the home. */
export const CODE_LOGIN_KEY = "vg.passkey.code-login";
