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

## V&G game implementations

Game rules, story, dialogue, visual presentation, Snake and Midnight Circuit are original V&G implementations. No commercial game artwork, sprites or audio are used. Sound cues use original Web Audio oscillator tones. Personal artwork remains explicitly marked placeholders.

## Monogatari visual-novel integration

- Dependency: `@monogatari/core`, pinned to **2.6.0** in the lockfile.
- License: MIT; copyright (c) Diego Islas Ocampo, as stated in the installed release.
- Source: <https://github.com/Monogatari/Monogatari>.
- Full retained license: `licenses/Monogatari-MIT.txt`.

The V&G adapter executes original story transitions through Monogatari's function-action application cycle (`willApply`, `apply`, `didApply`). It does not initialise the default engine UI or storage. `scripts/prepare-novel-engine.mjs` compiles the unmodified, installed action module and its reachable dependencies into a lazy-loaded 36KB browser module. It copies complete licenses into `/vendor/monogatari/THIRD_PARTY_LICENSES.txt`. No project, default stylesheet, character assets, particles, Font Awesome icons or sounds are copied into the application.

The generated bundle includes `@aegis-framework/artemis` 0.3.29 (MIT, copyright 2016–2021 Diego Islas Ocampo); its full license is retained alongside the generated runtime. The original source files are not modified. Build output preserves legal comments. The build rejects accidental inclusion of Mousetrap, Font Awesome or tsParticles, so importing this integration cannot create their global input/rendering handlers.

Release 2.8.0 was inspected but not adopted: its published export targets are missing and its git-sourced random-js build requires Yarn. Release 2.6.0 has a verifiable npm artifact and the required stable action API. Its unused esbuild build-tool dependency is overridden to patched 0.25.x; our preparation script uses pinned esbuild 0.25.12 (MIT). Do not upgrade Monogatari without checking its license, exported API, dependency graph and mobile behaviour.
