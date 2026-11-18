"use client";

import { useEffect, useState } from "react";

import { CODE_LOGIN_KEY } from "./passkey-client";
import {
  markPasskeyOffered,
  passkeyAlreadyOffered,
  PasskeySetupButton,
  usePasskeySupport,
} from "./passkey-setup";

/**
 * "Unlock with Face ID next time?" — once per device, right after a login
 * with the code (the entrance redirects at once, so the question waits
 * here). Later it lives in the More menu.
 */
export function PasskeyOffer() {
  const name = usePasskeySupport();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!name) return;
    let fresh = false;
    try {
      fresh = window.sessionStorage.getItem(CODE_LOGIN_KEY) === "1";
      window.sessionStorage.removeItem(CODE_LOGIN_KEY);
    } catch {
      return;
    }
    if (!fresh || passkeyAlreadyOffered()) return;
    const timer = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [name]);

  if (!open || !name) return null;
  const close = () => {
    markPasskeyOffered();
    setOpen(false);
  };
  return (
    <div
      aria-labelledby="passkey-offer-title"
      aria-modal="false"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-sm rounded-[1.4rem] bg-[var(--ink)] p-5 text-[var(--paper-white)] shadow-2xl lg:bottom-6"
      role="dialog"
    >
      <p className="font-display text-2xl italic" id="passkey-offer-title">
        Unlock with {name} next time?
      </p>
      <p className="mt-1 text-sm text-white/70">
        No code to type: one look and you&apos;re in. The code keeps working.
      </p>
      <div className="mt-4 grid gap-2">
        <PasskeySetupButton
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--paper-white)] px-5 text-sm font-semibold text-[var(--ink)]"
          label={`Yes, use ${name}`}
          onDone={(ok) => {
            if (ok) window.setTimeout(close, 1600);
          }}
        />
        <button
          className="min-h-11 text-sm text-white/70 underline-offset-4 hover:underline"
          onClick={close}
          type="button"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
