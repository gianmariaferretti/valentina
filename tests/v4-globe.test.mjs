import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { cityGlobe } from "../src/features/globe/lib/city-globe-data.ts";
import {
  alongGreatCircle,
  anglesFor,
  arcPath,
  centerOf,
  project,
} from "../src/features/globe/lib/geo.ts";
import { globeId } from "../src/features/globe/lib/types.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("great circles start, end and pass through the right places", () => {
  const rome = [41.9, 12.5];
  const cartagena = [10.39, -75.48];
  const [a0, b0] = alongGreatCircle(rome, cartagena, 0);
  close(a0, rome[0]);
  close(b0, rome[1]);
  const [a1, b1] = alongGreatCircle(rome, cartagena, 1);
  close(a1, cartagena[0]);
  close(b1, cartagena[1]);
  const mid = alongGreatCircle(rome, cartagena, 0.5);
  assert.ok(mid[1] < rome[1] && mid[1] > cartagena[1]);
  // Great circle bulges north between Europe and the Caribbean.
  assert.ok(mid[0] > (rome[0] + cartagena[0]) / 2);
});

test("projection: the centre is in the middle, the antipode hidden", () => {
  const p = project([41.9, 12.5], [41.9, 12.5], 100);
  close(p.x, 100);
  close(p.y, 100);
  assert.equal(p.visible, true);
  assert.equal(project([-41.9, -167.5], [41.9, 12.5], 100).visible, false);
  assert.match(
    arcPath([41.9, 12.5], [53.5, 10], [45, 10], 100),
    /^M[\d.]+ [\d.]+L/,
  );
  const c = centerOf([
    [0, 10],
    [0, 30],
  ]);
  close(c[0], 0);
  close(c[1], 20);
  const { phi, theta } = anglesFor([0, 90]);
  close(theta, 0);
  close(phi, Math.PI);
});

test("home globe: her city to his first, the others to the nearer one", () => {
  const { points, arcs } = cityGlobe(
    [
      {
        name: "Rome",
        timeZone: "Europe/Rome",
        latitude: 41.9,
        longitude: 12.5,
        who: "Gianmaria",
      },
      {
        name: "Cartagena",
        timeZone: "America/Bogota",
        latitude: 10.39,
        longitude: -75.48,
        who: "Valentina",
      },
      {
        name: "Barranquilla",
        timeZone: "America/Bogota",
        latitude: 10.96,
        longitude: -74.8,
        who: "",
      },
      {
        name: "Hamburg",
        timeZone: "Europe/Berlin",
        latitude: 53.55,
        longitude: 9.99,
        who: "",
      },
    ],
    { Rome: "☀️ 14°" },
  );
  assert.deepEqual(
    points.map((p) => p.id),
    ["rome", "cartagena", "barranquilla", "hamburg"],
  );
  assert.equal(points[0].badge, "☀️ 14°");
  assert.deepEqual(
    arcs.map((a) => a.id),
    ["cartagena--rome", "barranquilla--cartagena", "hamburg--rome"],
  );
  assert.equal(globeId("Polignano a Mare"), "polignano-a-mare");
  assert.equal(globeId("Medellín"), "medellin");
});

test("the globe loads lazily, pauses, and keeps a static version", () => {
  const lazy = read("src/features/globe/components/city-globe.tsx");
  assert.match(
    lazy,
    /dynamic\(\(\) => import\("\.\/live-globe"\), \{ ssr: false \}\)/,
  );
  assert.match(lazy, /IntersectionObserver/);
  assert.match(lazy, /canRunEffects\(\)/);
  assert.match(lazy, /<StaticGlobe/);
  const live = read("src/features/globe/components/live-globe.tsx");
  assert.match(live, /visibilitychange/);
  assert.match(live, /IntersectionObserver/);
  assert.match(live, /CSS\.supports\("anchor-name: --x"\)/);
  // No separate stylesheet: it would delay the streamed page (LCP).
  assert.match(live, /touch-pan-y/);
  assert.doesNotMatch(lazy + live, /\.module\.css/);
  assert.match(
    read("THIRD_PARTY_NOTICES.md"),
    /`cobe`\s*\|\s*2\.0\.1\s*\|\s*MIT/,
  );
});
