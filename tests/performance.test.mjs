import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function files(dir, out = []) {
  for (const name of readdirSync(new URL(`../${dir}`, import.meta.url))) {
    const path = `${dir}/${name}`;
    if (statSync(new URL(`../${path}`, import.meta.url)).isDirectory())
      files(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

test("MapLibre is loaded only when a map is drawn", () => {
  assert.doesNotMatch(read("src/app/layout.tsx"), /maplibre/);
  for (const file of files("src")) {
    const source = read(file);
    // Only type imports are static; the library itself is import()-ed.
    for (const line of source.match(/^import [^;]*from "maplibre-gl";$/gm) ??
      [])
      assert.match(line, /^import type /, `${file}: ${line}`);
  }
  assert.match(
    read("src/features/map/lib/map-config.ts"),
    /import\("maplibre-gl"\)/,
  );
  assert.match(
    read("src/features/map/components/place-mini-map-lazy.tsx"),
    /dynamic\(\s*\(\) => import\("\.\/place-mini-map"\)/,
  );
  for (const page of ["map/page.tsx", "map/[place]/page.tsx"])
    assert.match(
      read(`src/app/(experience)/${page}`),
      /import "maplibre-gl\/dist\/maplibre-gl\.css";/,
    );
});

test("the canvas games stay behind next/dynamic", () => {
  const experience = read("src/features/games/components/game-experience.tsx");
  for (const engine of [
    "break-defences-game",
    "relationship-minefield-game",
    "memories-game",
    "snake-game",
    "maze-game",
  ])
    assert.match(
      experience,
      new RegExp(`import\\("\\.\\./engines/${engine}"\\)`),
    );
});

test("globals.css keeps only shared styles", () => {
  const globals = read("src/app/globals.css");
  assert.doesNotMatch(
    globals,
    /\.(map-|place-|vg-map-marker|envelope|letter|open-when-|reward-reveal)/,
  );
  assert.ok(globals.split("\n").length < 1400, "globals.css stays small");
  assert.match(
    read("src/features/open-when/components/envelope.tsx"),
    /open-when\.css/,
  );
  assert.match(
    read("src/features/rewards/components/reward-reveal.tsx"),
    /reward-reveal\.css/,
  );
});

test("FadeIn is CSS only and content is visible without JavaScript", () => {
  const fade = read("src/components/motion/fade-in.tsx");
  assert.doesNotMatch(fade, /"use client"|motion\/react/);
  const globals = read("src/app/globals.css");
  const routeEnter = globals.slice(globals.indexOf("@keyframes route-enter"));
  assert.doesNotMatch(
    routeEnter.slice(0, routeEnter.indexOf("}\n}")),
    /opacity/,
  );
  assert.match(globals, /\.fade-in \{\s*animation: none;/);
});

test("holographic effects run only on the active card", () => {
  const css = read("src/features/coupons/components/wallet.module.css");
  for (const match of css.matchAll(
    /^([^{}]*)\{[^{}]*animation: (holo-drift|twinkle|glitch)/gm,
  ))
    assert.match(match[1], /data-active="true"/, match[1]);
  const hook = read("src/hooks/use-holo-tilt.ts");
  assert.match(hook, /let releaseCurrent/);
  assert.match(hook, /startTilt\(\)/);
});

test("other report fixes stay in place", () => {
  assert.match(read("src/app/(experience)/loading.tsx"), /min-h-\[100svh\]/);
  assert.match(
    read("src/app/(experience)/layout.tsx"),
    /<Suspense[\s\S]{0,240}<ProgressIndicator \/>\s*<\/Suspense>/,
  );
  assert.match(
    read("src/features/media/lib/private-media.ts"),
    /bucketVerifiedAt/,
  );
  assert.doesNotMatch(
    read("src/features/italian-corner/world/world-scene.tsx")
      .split("character-")[0]
      .slice(-200),
    /priority/,
  );
  let total = 0;
  for (const name of readdirSync(
    new URL("../public/images/academy", import.meta.url),
  ))
    total += statSync(
      new URL(`../public/images/academy/${name}`, import.meta.url),
    ).size;
  assert.ok(total < 5_000_000, `Academy images: ${total} bytes`);
});
