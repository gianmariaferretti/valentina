import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  METEOCONS_USED,
  meteoconFor,
} from "../src/features/life/lib/weather.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const file = (path) => new URL(`../${path}`, import.meta.url);

test("WMO codes map to day and night icons", () => {
  assert.equal(meteoconFor(0, true), "clear-day");
  assert.equal(meteoconFor(0, false), "clear-night");
  assert.equal(meteoconFor(2, false), "partly-cloudy-night");
  assert.equal(meteoconFor(45, true), "fog-day");
  assert.equal(meteoconFor(53, true), "partly-cloudy-day-drizzle");
  assert.equal(meteoconFor(63), "rain");
  assert.equal(meteoconFor(66), "sleet");
  assert.equal(meteoconFor(73), "snow");
  assert.equal(meteoconFor(81, false), "partly-cloudy-night-rain");
  assert.equal(meteoconFor(95, false), "thunderstorms-night-rain");
  assert.equal(meteoconFor(99, true), "thunderstorms-day-hail");
});

test("every icon the site can show is self-hosted, animated and static", () => {
  const produced = new Set();
  for (let code = 0; code <= 99; code++)
    for (const day of [true, false]) produced.add(meteoconFor(code, day));
  for (const slug of produced) {
    assert.ok(
      METEOCONS_USED.includes(slug),
      `${slug} missing from METEOCONS_USED`,
    );
    for (const style of ["animated", "static"]) {
      const path = `public/weather/${style}/${slug}.svg`;
      assert.ok(existsSync(file(path)), path);
      // The MIT notice travels with every copied icon.
      assert.match(read(path), /Copyright \(c\) 2020-present Bas Milius/);
    }
  }
  // Only the icons we use are shipped, not the whole set.
  assert.ok(readdirSync(file("public/weather/animated")).length <= 30);
});

test("reduced motion gets the static icons without JavaScript", () => {
  const icon = read("src/features/life/components/weather-icon.tsx");
  assert.match(icon, /media="\(prefers-reduced-motion: reduce\)"/);
  assert.match(icon, /\/weather\/static\//);
  assert.doesNotMatch(icon, /"use client"/);
  // Nothing imports the full packages into a bundle.
  for (const path of [
    "src/features/life/components/city-clocks.tsx",
    "src/features/globe/components/live-globe.tsx",
    "src/features/life/components/city-strip.tsx",
  ])
    assert.doesNotMatch(read(path), /@meteocons/);
  const notices = read("THIRD_PARTY_NOTICES.md");
  assert.match(notices, /@meteocons\/svg/);
  assert.match(notices, /Copyright \(c\) 2020-present Bas Milius/);
});
