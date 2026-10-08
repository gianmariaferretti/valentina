# Third-party notices

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
