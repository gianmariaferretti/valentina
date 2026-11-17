import { spawnSync } from "node:child_process";

import { createSerwistRoute } from "@serwist/turbopack";

// A new revision of the offline page on every build.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() ??
  crypto.randomUUID();

/** Serves /serwist/sw.js, built from src/app/sw.ts. Public: no private data. */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
    // Precache only styles and fonts; scripts are cached when first used.
    globPatterns: [".next/static/**/*.{css,woff,woff2}"],
    additionalPrecacheEntries: [{ url: "/offline", revision: revision || "1" }],
  });
