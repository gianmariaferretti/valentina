import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Audit A7: only the hosts the site really talks to. The map style host
// (OpenFreeMap by default) serves tiles, glyphs and sprites.
function mapHosts(): string {
  const hosts = new Set(["https://tiles.openfreemap.org"]);
  try {
    if (process.env.NEXT_PUBLIC_MAP_STYLE_URL)
      hosts.add(new URL(process.env.NEXT_PUBLIC_MAP_STYLE_URL).origin);
  } catch {
    // Invalid URL: the map falls back to OpenFreeMap.
  }
  return [...hosts].join(" ");
}
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mapHosts()}`,
  "font-src 'self' data:",
  `connect-src 'self' ${mapHosts()}` + (isDevelopment ? " http: ws:" : ""),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Our songs: Spotify's embed player only.
  "frame-src https://open.spotify.com",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Lesson JSON is read server-side; include future owner-authored files in deploy traces.
  outputFileTracingIncludes: {
    "/italian-corner/academy/**/*": ["./src/content/italian/**/*.json"],
  },
  // Do not allow the public optimizer to proxy authenticated API media.
  images: {
    localPatterns: [
      { pathname: "/images/map/**", search: "" },
      { pathname: "/images/awards/**", search: "" },
      { pathname: "/images/academy/**", search: "" },
      { pathname: "/images/year-one-cover.svg", search: "" },
    ],
  },
  // Bounded deterministic paddle transcripts can exceed the default 1MB.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // Audit A13: HTTPS only, also without relying on the platform.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
      {
        // The service worker must always be checked for updates.
        source: "/serwist/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

// Serwist (PWA) bundles the service worker with esbuild at build time.
export default withSerwist(nextConfig);
