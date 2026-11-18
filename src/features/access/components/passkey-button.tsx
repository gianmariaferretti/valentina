"use client";

import { ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  biometricName,
  canUsePasskeys,
  unlockWithPasskey,
} from "./passkey-client";

/**
 * "Unlock with Face ID" on the entrance, above the code field. Shown only
 * where the device has its own biometric lock; works in the installed app.
 */
export function PasskeyButton() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void canUsePasskeys().then((ok) => {
      if (alive && ok) setName(biometricName(navigator.userAgent));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!name) return null;
  return (
    <div className="mb-6">
      <button
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--paper-white)] transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] disabled:opacity-60"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          const result = await unlockWithPasskey();
          if (result.ok) {
            router.replace("/home");
            router.refresh();
            return;
          }
          setBusy(false);
          setMessage(result.message);
        }}
        type="button"
      >
        <ScanFace aria-hidden="true" size={20} />
        {busy ? "Checking…" : `Unlock with ${name}`}
      </button>
      <p
        aria-live="polite"
        className="mt-2 min-h-5 text-center text-sm text-[var(--rust)]"
      >
        {message}
      </p>
      <p className="text-center text-[0.62rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        or use the code
      </p>
    </div>
  );
}
