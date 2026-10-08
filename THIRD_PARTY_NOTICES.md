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

The seven V&G Games and the existing Snake and Midnight Circuit challenges are original in-house implementations. No third-party game engine, gameplay source, sprite set, sound pack or commercial game asset was added for this work. Sound cues are generated at runtime with the browser Web Audio API, and game imagery references the application’s existing source-controlled placeholder registry. There are therefore no additional game-specific license or attribution requirements.
