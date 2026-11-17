"use client";

import dynamic from "next/dynamic";

/** The place mini-map, loaded only on the place page and only in the browser. */
export const PlaceMiniMapLazy = dynamic(
  () => import("./place-mini-map").then((module) => module.PlaceMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="place-mini-map">
        <p className="place-mini-map__loading">Map prepared on approach</p>
      </div>
    ),
  },
);
