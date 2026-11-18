# Third-party notices

The site's code is licensed under **GPL-3.0-or-later** (`LICENSE`). Personal content is not: see `CONTENT-NOTICE.md`.

## Relationship Contract PDF

The private certificate is generated with `pdf-lib` 1.17.1, licensed under MIT. Source and license: <https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md>. The published npm package retains its license; V&G's document layout, wording and signature workflow are original project code. No third-party fonts, photographs or contract templates are bundled for this feature.

## Spicy Archive

The envelope illustration, stage choreography and single-image strip reveal are original V&G code using the existing Motion and Next.js dependencies. No new runtime or project dependency was added, and no stock or generated personal photographs are used.

An optional **external QA-only** installation of `@electric-sql/pglite` 0.5.8 was used to execute PostgreSQL migrations and rollback tests without touching the live Supabase project. Its Apache-2.0 license was checked at <https://github.com/electric-sql/pglite/blob/main/LICENSE>. The package, WASM binaries and third-party source are not copied into this repository or the deployed application. The optional test fixture dynamically imports a separately installed module; retain upstream notices if distributing that installation.

## MapLibre GL JS

- Package: `maplibre-gl`
- Version installed: 6.13.0
- License: BSD-3-Clause
- Copyright: MapLibre contributors
- Source and license: <https://github.com/maplibre/maplibre-gl-js>

The npm package includes its complete `LICENSE.txt`, including notices for incorporated upstream code. V&G does not copy or modify MapLibre source code; it consumes the published package through the project dependency lockfile.

## OpenFreeMap and map data

The default runtime map style and vector tiles are provided by OpenFreeMap. They are not bundled into this repository.

- Service and usage information: <https://openfreemap.org/>
- Terms: <https://openfreemap.org/tos/>
- Default style: `https://tiles.openfreemap.org/styles/liberty`
- Required map attribution: OpenFreeMap © OpenMapTiles, data from OpenStreetMap

MapLibre displays the attribution supplied by the configured style. Do not remove the attribution control. Deployments may replace the style through `NEXT_PUBLIC_MAP_STYLE_URL`; the deployer is responsible for the selected provider’s terms and attribution requirements.

## V&G Arcade implementations

Breakout, Minesweeper, Memory, Snake and Maze are original in-house TypeScript implementations. Snake and Maze reuse the repository's earlier in-house rules/generation strategies; no third-party game code, commercial artwork, sprites or audio packs are shipped. Sound cues use original Web Audio oscillator tones. Memory uses existing Lucide icons as explicitly replaceable symbols, not invented personal photographs.

### Memory reference review (8 October 2026)

Reference: <https://github.com/lyn-kodehode/React-memory-game>.

The README, package manifest, card state/shuffle/matching logic, flip CSS and responsive grid were reviewed. The repository's inspected recursive file tree contains no LICENSE/COPYING file and its package manifest does not declare a license. Public visibility does not grant a reuse license. No source or assets were copied; V&G's finite-state rules, Fisher–Yates shuffle and card styling were implemented independently.

The retired novel's `@monogatari/core` dependency, adapter, generated runtime preparation and associated notices are no longer part of the shipped application. Historical commits retain that implementation and its licenses. No new dependencies are introduced by this Arcade overhaul.

## Travel photo preparation

Supplied photographs were converted locally using macOS `sips` and Sharp 0.35.5 (Apache-2.0), already present through Next.js. The installed `@img/sharp-libvips-darwin-arm64` distribution declares LGPL-3.0-or-later; upstream libvips itself is LGPL-2.1-or-later. These installed package licenses were checked locally. No new package, third-party photograph, generated personal image or borrowed asset was introduced. Only optimized WebP copies, not originals or metadata, are committed. Photo filenames and associations are documented in `docs/photo-integration.md`.

## Kiss Casino v2

Runtime libraries added through the npm lockfile (published packages, not copied or modified; each package retains its own license file). All declare React 19 support in their peer dependencies and were checked against React 19 / Next.js 16:

| Package           | Version | License | Use                                                                                                | Source                                      |
| ----------------- | ------- | ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `canvas-confetti` | 1.9.4   | ISC     | Confetti and 💋 rain on BIG / MEGA / JACKPOT wins (loaded on demand, disabled with reduced motion) | <https://github.com/catdad/canvas-confetti> |
| `howler`          | 2.2.4   | MIT     | Casino sound effects (loaded only after sound is switched on)                                      | <https://github.com/goldfire/howler.js>     |
| `vaul`            | 1.1.2   | MIT     | Bottom drawers for Rewards and the Kiss Shop                                                       | <https://github.com/emilkowalski/vaul>      |
| `sonner`          | 2.0.8   | MIT     | Toasts ("You won: …", redemption notices)                                                          | <https://github.com/emilkowalski/sonner>    |

The casino sounds in `public/sounds/casino/` are original, synthesised by `scripts/generate-casino-sounds.mjs`; no third-party audio is included. The croupier illustration, slot symbols layout, roulette and wheel artwork are original SVG/CSS.

Reviewed for ideas only, no code copied: `johakr/html5-slot-machine` (reel strip technique), `react-custom-roulette` and its React 19 fork (wheel layout), Magic UI (effect patterns).

### Holographic prize card (GPL-3.0)

`src/features/casino/components/holo-card.tsx` and `src/features/casino/components/holo-card.module.css` are derived from **pokemon-cards-css** by Simon Goellner (@simeydotme), <https://github.com/simeydotme/pokemon-cards-css>, licensed under the GNU General Public License v3.0. Only the CSS gradient/blend layers and the pointer-to-CSS-variable interaction maths were adapted. No images, textures, card artwork, names, logos or other assets from that project are used. Each derived file carries an attribution header. These two derived files remain under the upstream GPL-3.0 terms (© Simon Goellner); because of them the site's code is distributed under the GPL, as GPL-3.0-or-later (`LICENSE`).

## Email notifications

- Package: `resend` 6.38.1 — MIT — <https://github.com/resend/resend-node>. Called only on the server to send Gianmaria's notification emails. Its optional `@react-email/render` peer is not installed; the emails are plain HTML written in this project.

## Installable app (PWA)

| Package              | Version | License | Use                                                                 | Source                               |
| -------------------- | ------- | ------- | ------------------------------------------------------------------- | ------------------------------------ |
| `serwist`            | 9.5.15  | MIT     | Service worker: caches static assets and public pages only          | <https://github.com/serwist/serwist> |
| `@serwist/turbopack` | 9.5.15  | MIT     | Builds and serves the service worker with Next.js and Turbopack     | <https://github.com/serwist/serwist> |
| `esbuild`            | 0.28.x  | MIT     | Bundles the service worker at build time (not shipped to the pages) | <https://github.com/evanw/esbuild>   |

The V+G monogram icons are original, drawn from plain shapes in `scripts/generate-icons.mjs`; no third-party artwork or fonts are used.

## Site v4 — cover fluid

| Code                                                                                    | License | Use                                                                                     |
| --------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (port) | MIT     | The fluid behind "YEAR TWO" on the cover (`src/features/landing/fluid/fluid-engine.ts`) |

Copyright (c) 2017 Pavel Dobryakov. The full MIT notice is kept at the top of
`fluid-engine.ts`. The port removes the debug panel, analytics, promo popup and
screenshot capture, generates the dithering texture in code and uses the site
palette; no asset from the original repository is shipped.

## Site v4 — globe

| Package | Version | License | Use                                                                  | Source                            |
| ------- | ------- | ------- | -------------------------------------------------------------------- | --------------------------------- |
| `cobe`  | 2.0.1   | MIT     | The globe with our cities (home, Next time, cover); loaded on demand | <https://github.com/shuding/cobe> |

Copyright (c) 2021 Shu Ding. The static fallback globe (SVG) is original code.

## Site v4 — weather icons

| Package                 | Version | License | Use                                              | Source                                   |
| ----------------------- | ------- | ------- | ------------------------------------------------ | ---------------------------------------- |
| `@meteocons/svg`        | 0.1.0   | MIT     | Animated weather icons (clocks, forecast, globe) | <https://github.com/basmilius/meteocons> |
| `@meteocons/svg-static` | 0.1.0   | MIT     | The same icons, still, for reduced motion        | <https://github.com/basmilius/meteocons> |

Meteocons — Copyright (c) 2020-present Bas Milius. Licensed under the MIT
License:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

Only the 21 icons the site uses are copied, by `scripts/sync-weather-icons.mjs`,
into `public/weather/animated` and `public/weather/static`. Each copied file
keeps a comment with the copyright notice.

## Site v4 — rolling numbers

| Package              | Version | License | Use                                                         | Source                                   |
| -------------------- | ------- | ------- | ----------------------------------------------------------- | ---------------------------------------- |
| `@number-flow/react` | 0.6.2   | MIT     | Rolling digits: days together, countdowns, 💋, counters     | <https://github.com/barvian/number-flow> |
| `number-flow`        | 0.6.2   | MIT     | The custom element behind `@number-flow/react` (dependency) | <https://github.com/barvian/number-flow> |
| `esm-env`            | 1.2.2   | MIT     | Environment detection used by `@number-flow/react`          | <https://github.com/benmccann/esm-env>   |

NumberFlow — Copyright (c) 2024 Maxwell Barvian. esm-env — Copyright 2022 Benjamin McCann.
Both are licensed under the MIT License:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Site v4 — hand-drawn marks

| Package          | Version | License | Use                                                                         | Source                                          |
| ---------------- | ------- | ------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| `rough-notation` | 0.5.1   | MIT     | Hand-drawn circles, underlines, strikes and highlighter (own React wrapper) | <https://github.com/rough-stuff/rough-notation> |

rough-notation — Copyright (c) 2020 Preet Shihn. Licensed under the MIT
License (the same permission text quoted above for NumberFlow).
