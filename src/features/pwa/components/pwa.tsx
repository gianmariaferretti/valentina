"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

/**
 * Registers the service worker in production. It never caches pages on
 * navigation (cacheOnNavigation off): only static assets and public pages.
 */
export function Pwa({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      cacheOnNavigation={false}
      disable={process.env.NODE_ENV !== "production"}
      reloadOnOnline={false}
      swUrl="/serwist/sw.js"
    >
      {children}
    </SerwistProvider>
  );
}
