"use client";

import { AttributionControl, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import {
  configureMapLibreWorker,
  MAP_STYLE_URL,
  toMapLibreLngLat,
} from "@/features/map/lib/map-config";
import type { Destination } from "@/features/map/types";

export function PlaceMiniMap({ place }: { place: Destination }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    configureMapLibreWorker();

    const map = new MapLibreMap({
      attributionControl: false,
      center: toMapLibreLngLat(place.coordinates),
      cooperativeGestures: true,
      dragRotate: false,
      maxPitch: 0,
      pitchWithRotate: false,
      scrollZoom: false,
      style: MAP_STYLE_URL,
      zoom: 9.2,
      container,
    });
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    const element = document.createElement("div");
    element.className = "vg-map-marker vg-map-marker--mini";
    element.setAttribute("aria-hidden", "true");

    const monogram = document.createElement("span");
    monogram.className = "vg-map-marker__monogram";
    monogram.textContent = "V+G";
    const code = document.createElement("span");
    code.className = "vg-map-marker__code";
    code.textContent = place.travelCode;
    const point = document.createElement("span");
    point.className = "vg-map-marker__point";
    element.append(monogram, code, point);

    const marker = new Marker({ anchor: "bottom", element })
      .setLngLat(toMapLibreLngLat(place.coordinates))
      .addTo(map);

    const handleError = () => {
      if (!map.isStyleLoaded()) setMapError(true);
    };
    map.once("load", () => setMapError(false));
    map.on("error", handleError);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.off("error", handleError);
      marker.remove();
      map.remove();
    };
  }, [place]);

  return (
    <div className="place-mini-map">
      <div
        aria-label={`Interactive map centered on ${place.city}, ${place.country}`}
        className="size-full"
        ref={containerRef}
        role="region"
      />
      {mapError ? (
        <p className="place-mini-map__error" role="status">
          Map unavailable · coordinates remain below
        </p>
      ) : null}
    </div>
  );
}
