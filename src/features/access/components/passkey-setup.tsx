"use client";

import { ScanFace } from "lucide-react";
import { useEffect, useState } from "react";

import {
  biometricName,
  canUsePasskeys,
  PASSKEY_OFFERED_KEY,
  setUpPasskey,
} from "./passkey-client";

/** Remembers that the offer was shown (once per device). */
export function markPasskeyOffered() {
  try {
    window.localStorage.setItem(PASSKEY_OFFERED_KEY, "1");
  } catch {
    // Private mode: it may be offered again, harmless.
  }
}

export function passkeyAlreadyOffered(): boolean {
  try {
    return window.localStorage.getItem(PASSKEY_OFFERED_KEY) === "1";
  } catch {
    return true;
  }
}

/** The device's biometric name, or null where passkeys can't work. */
export function usePasskeySupport(): string | null | undefined {
  const [name, setName] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void canUsePasskeys().then((ok) => {
      if (alive) setName(ok ? biometricName(navigator.userAgent) : null);
    });
    return () => {
      alive = false;
    };
  }, []);
  return name;
}

/**
 * "Set up Face ID" — in the More menu (settings), and the body of the
 * one-time offer after a code login.
 */
export function PasskeySetupButton({
  className,
  label,
  onDone,
}: {
  className?: string;
  label?: string;
  onDone?: (ok: boolean) => void;
}) {
  const name = usePasskeySupport();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!name) return null;
  return (
    <div>
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          const result = await setUpPasskey();
          markPasskeyOffered();
          setBusy(false);
          setMessage(
            result.ok
              ? `${name} is on. Next time, one look and you're in.`
              : result.message,
          );
          onDone?.(result.ok);
        }}
        type="button"
      >
        <ScanFace aria-hidden="true" size={18} />
        {busy ? "Setting up…" : (label ?? `Unlock with ${name}`)}
      </button>
      {message ? (
        <p aria-live="polite" className="mt-2 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
