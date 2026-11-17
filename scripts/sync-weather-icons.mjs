// Copies only the Meteocons icons the site uses (animated + static) into
// public/weather/, each with the MIT copyright notice the license asks for.
// Run after changing METEOCONS_USED: node scripts/sync-weather-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/features/life/lib/weather.ts", "utf8");
const block = source.slice(source.indexOf("export const METEOCONS_USED"));
const list = new Set();
for (const m of block.matchAll(/"([a-z-]+)"/g)) list.add(m[1]);
// Expand the generated names.
for (const name of ["clear", "partly-cloudy", "overcast", "fog"])
  for (const dn of ["day", "night"]) list.add(`${name}-${dn}`);
for (const kind of ["drizzle", "rain", "snow"])
  for (const dn of ["day", "night"]) list.add(`partly-cloudy-${dn}-${kind}`);
const slugs = [...list].filter(
  (slug) =>
    !["clear", "partly-cloudy", "overcast", "fog", "drizzle"].includes(slug),
);

const notice = `<!--
  Meteocons by Bas Milius — https://github.com/basmilius/meteocons
  Copyright (c) 2020-present Bas Milius. MIT License: see THIRD_PARTY_NOTICES.md.
-->
`;

for (const [style, pkg] of [
  ["animated", "@meteocons/svg"],
  ["static", "@meteocons/svg-static"],
]) {
  mkdirSync(`public/weather/${style}`, { recursive: true });
  for (const slug of slugs) {
    const svg = readFileSync(`node_modules/${pkg}/fill/${slug}.svg`, "utf8");
    writeFileSync(`public/weather/${style}/${slug}.svg`, notice + svg);
  }
}
console.log(`${slugs.length} icons × 2 styles written.`);
