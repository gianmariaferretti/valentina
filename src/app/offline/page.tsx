import type { Metadata } from "next";

import { OfflineRetry } from "@/features/pwa/components/offline-retry";

export const metadata: Metadata = { title: "No signal" };

/**
 * Shown by the service worker when a page can't load without a connection.
 * Public and static: it is cached, so it must never contain private content.
 */
export default function OfflinePage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--ink)] px-6 py-16 text-center text-[var(--paper-white)]">
      <div className="max-w-md">
        <p className="font-display text-2xl tracking-[-0.04em]">
          V <span className="text-[var(--red-muted)]">+</span> G
        </p>
        <p aria-hidden="true" className="mt-10 text-5xl">
          📡
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.05em] sm:text-6xl">
          No signal — but still yours.
        </h1>
        <p className="mx-auto mt-5 max-w-sm leading-7 text-white/70">
          The archive needs a connection to open. Find some Wi-Fi, or a hotspot,
          or a very cooperative café. Everything will be exactly where you left
          it.
        </p>
        <OfflineRetry />
      </div>
    </main>
  );
}
