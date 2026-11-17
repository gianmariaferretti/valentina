import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { fluidPalette } from "../src/features/landing/fluid/palette.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the fluid port keeps the MIT attribution and drops the extras", () => {
  const engine = read("src/features/landing/fluid/fluid-engine.ts");
  assert.match(engine, /Copyright \(c\) 2017 Pavel Dobryakov/);
  assert.match(engine, /PavelDoGreat\/WebGL-Fluid-Simulation/);
  assert.match(engine, /THE SOFTWARE IS PROVIDED "AS IS"/);
  // Code only (the header explains what was removed).
  const code = engine.slice(engine.indexOf("export type Rgb"));
  for (const banned of [
    /dat\.GUI/,
    /\bga\(/,
    /captureScreenshot/,
    /promo/i,
    /LDR_LLL1_0\.png/,
    /preventDefault/,
  ])
    assert.doesNotMatch(code, banned);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /WebGL Fluid Simulation/);
});

test("the palette is the site's, no rainbow", () => {
  assert.equal(fluidPalette.length, 5);
  for (const { color } of fluidPalette)
    for (const channel of Object.values(color))
      assert.ok(channel >= 0 && channel <= 1);
});

test("the fluid loads lazily, watches passively and has a static fallback", () => {
  const cover = read("src/features/landing/fluid/cover-fluid.tsx");
  assert.match(
    cover,
    /dynamic\(\(\) => import\("\.\/fluid-layer"\), \{ ssr: false \}\)/,
  );
  assert.match(cover, /canRunEffects\(\)/);
  assert.match(cover, /afterFirstPaint\(/);
  const caps = read("src/lib/effects/capabilities.ts");
  assert.match(caps, /prefers-reduced-motion: reduce/);
  assert.match(caps, /getBattery/);
  assert.match(caps, /requestIdleCallback/);
  // No GPU (software WebGL) keeps the static version.
  assert.match(caps, /swiftshader\|llvmpipe/);
  const layer = read("src/features/landing/fluid/fluid-layer.tsx");
  assert.match(layer, /passive: true/);
  assert.match(layer, /IntersectionObserver/);
  assert.match(layer, /visibilitychange/);
  assert.match(layer, /if \(slow > 30\) onFail\(\)/);
  // The cover itself never imports the WebGL engine statically.
  assert.doesNotMatch(read("src/app/page.tsx"), /fluid-engine|fluid-layer/);
  const css = read("src/features/landing/fluid/fluid.module.css");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /pointer-events: none/);
});
