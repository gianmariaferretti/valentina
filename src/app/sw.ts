/// <reference lib="webworker" />
/*
 * The V+G service worker (Serwist). Deliberately small: it caches only
 * static assets (scripts, styles, fonts, icons, sounds) and the public
 * pages (/, /access, /offline). Private pages, RSC payloads, API routes,
 * server actions, photos and /admin always go to the network and are never
 * stored. Without a connection, a page shows /offline.
 */
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const PUBLIC_PAGES = new Set(["/", "/access", "/offline"]);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      // Hashed build files (JS, CSS, self-hosted fonts): never change.
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "vg-static",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 60,
          }),
        ],
      }),
    },
    {
      // App icons and interface sounds (not photos).
      matcher: ({ sameOrigin, url }) =>
        sameOrigin &&
        (url.pathname.startsWith("/icons/") ||
          url.pathname.startsWith("/sounds/") ||
          /^\/(favicon\.ico|icon\.svg|apple-icon\.png|manifest\.webmanifest)$/.test(
            url.pathname,
          )),
      handler: new CacheFirst({
        cacheName: "vg-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      // Public pages only: the cover, the door and the offline page.
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        request.mode === "navigate" &&
        PUBLIC_PAGES.has(url.pathname),
      handler: new NetworkFirst({
        cacheName: "vg-public-pages",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 5 })],
      }),
    },
    {
      // Everything else (private pages, RSC, API, photos, /admin): network
      // only, never stored.
      matcher: () => true,
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
