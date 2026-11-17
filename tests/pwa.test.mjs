import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import manifest from "../src/app/manifest.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bytes = (path) => readFileSync(new URL(`../${path}`, import.meta.url));

/** Width and height from a PNG header. */
function pngSize(path) {
  const data = bytes(path);
  assert.equal(data.toString("ascii", 1, 4), "PNG", path);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

test("manifest: V+G, standalone, site colours, every icon size", () => {
  const m = manifest();
  assert.equal(m.name, "V+G");
  assert.equal(m.display, "standalone");
  assert.equal(m.theme_color, "#f2ebe0");
  assert.equal(m.background_color, "#f2ebe0");
  const icons = Object.fromEntries(
    m.icons.map((icon) => [icon.purpose ?? "any:" + icon.sizes, icon.src]),
  );
  assert.equal(icons["any:192x192"], "/icons/icon-192.png");
  assert.equal(icons["any:512x512"], "/icons/icon-512.png");
  assert.equal(icons.maskable, "/icons/maskable-512.png");
  assert.deepEqual(pngSize("public/icons/icon-192.png"), [192, 192]);
  assert.deepEqual(pngSize("public/icons/icon-512.png"), [512, 512]);
  assert.deepEqual(pngSize("public/icons/maskable-512.png"), [512, 512]);
  assert.deepEqual(pngSize("src/app/apple-icon.png"), [180, 180]);
  const favicon = bytes("src/app/favicon.ico");
  assert.equal(favicon.readUInt16LE(2), 1, "an .ico file");
  assert.match(read("src/app/icon.svg"), /^<svg/);
});

test("the service worker caches only static assets and public pages", () => {
  // Code only: the comments explain what is never cached.
  const sw = read("src/app/sw.ts")
    .replace(/\/\*[^]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(
    sw,
    /defaultCache/,
    "Serwist's default caches pages and APIs",
  );
  assert.match(
    sw,
    /const PUBLIC_PAGES = new Set\(\["\/", "\/access", "\/offline"\]\)/,
  );
  // The last rule sends everything else to the network, without storing it.
  assert.match(sw, /matcher: \(\) => true,\s*handler: new NetworkOnly\(\)/);
  assert.equal(sw.match(/new NetworkFirst\(/g).length, 1);
  assert.equal(sw.match(/new CacheFirst\(/g).length, 2);
  assert.match(sw, /url\.pathname\.startsWith\("\/_next\/static\/"\)/);
  assert.doesNotMatch(sw, /images|\/api|\/admin|_next\/image/);
  assert.match(sw, /url: "\/offline"/);
  assert.doesNotMatch(sw, /addEventListener\("push"|pushManager/i, "no push");
  const route = read("src/app/serwist/[path]/route.ts");
  assert.match(
    route,
    /globPatterns: \[".next\/static\/\*\*\/\*\.\{css,woff,woff2\}"\]/,
  );
  const provider = read("src/features/pwa/components/pwa.tsx");
  assert.match(provider, /cacheOnNavigation=\{false\}/);
  assert.match(provider, /swUrl="\/serwist\/sw\.js"/);
});

test("the manifest, the worker and the offline page are public; nothing else", async () => {
  const { config, isPublicPath } = await import("../src/proxy.ts");
  assert.equal(isPublicPath("/manifest.webmanifest"), true);
  assert.equal(isPublicPath("/offline"), true);
  assert.equal(isPublicPath("/home"), false);
  // /serwist/sw.js has a file extension: it never reaches the proxy.
  const matcher = new RegExp(
    `^${config.matcher[0].replace("/((?!", "/(?!").replace(").*)", ").*")}$`,
  );
  assert.equal(matcher.test("/serwist/sw.js"), false);
  assert.equal(matcher.test("/home"), true);
  const offline = read("src/app/offline/page.tsx");
  assert.doesNotMatch(offline, /session|supabase|repositories|data\//i);
  assert.match(offline, /No signal — but still yours\./);
});

test("the iPhone banner shows once and never inside the installed app", () => {
  const banner = read("src/features/pwa/components/ios-install-banner.tsx");
  assert.match(banner, /localStorage\.getItem\(SEEN_KEY\)/);
  assert.match(banner, /localStorage\.setItem\(SEEN_KEY, "1"\)/);
  assert.match(banner, /display-mode: standalone/);
  assert.match(banner, /iPhone\|iPad\|iPod/);
  assert.match(
    read("src/app/(experience)/layout.tsx"),
    /<IosInstallBanner \/>/,
  );
  assert.match(read("src/app/layout.tsx"), /appleWebApp: \{ capable: true/);
});
