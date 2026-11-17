"use client";

import { useEffect } from "react";

/** Tries again by itself as soon as the connection comes back. */
export function OfflineRetry() {
  useEffect(() => {
    const back = () => window.location.reload();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);
  return (
    <button
      className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[var(--paper-white)] px-6 text-xs font-bold tracking-[0.14em] text-[var(--ink)] uppercase"
      onClick={() => window.location.reload()}
      type="button"
    >
      Try again
    </button>
  );
}
