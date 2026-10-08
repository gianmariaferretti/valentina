"use client";

import { ArrowUpRight, LocateFixed, MapPin, X } from "lucide-react";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  configureMapLibreWorker,
  MAP_STYLE_URL,
  toMapLibreLngLat,
} from "@/features/map/lib/map-config";
import type { Destination } from "@/features/map/types";

interface DestinationMarker {
  readonly marker: Marker;
  readonly element: HTMLButtonElement;
  readonly handleClick: (event: MouseEvent) => void;
}

function buildBounds(destinations: readonly Destination[]): LngLatBounds {
  const bounds = new LngLatBounds();
  destinations.forEach((destination) =>
    bounds.extend(toMapLibreLngLat(destination.coordinates)),
  );

  if (!bounds.isEmpty()) {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    bounds.extend([southWest.lng - 2, southWest.lat - 1.5]);
    bounds.extend([northEast.lng + 2, northEast.lat + 1.5]);
  }

  return bounds;
}

function createMarkerElement(destination: Destination): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "vg-map-marker";
  element.dataset.active = "false";
  element.setAttribute(
    "aria-label",
    `Show ${destination.city}, ${destination.country}`,
  );
  element.setAttribute("aria-pressed", "false");

  const monogram = document.createElement("span");
  monogram.className = "vg-map-marker__monogram";
  monogram.textContent = "V+G";

  const code = document.createElement("span");
  code.className = "vg-map-marker__code";
  code.textContent = destination.travelCode;

  const point = document.createElement("span");
  point.className = "vg-map-marker__point";
  point.setAttribute("aria-hidden", "true");

  element.append(monogram, code, point);
  return element;
}

export function EuropeMapExperience({
  destinations,
}: {
  destinations: readonly Destination[];
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<DestinationMarker[]>([]);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const selectedPlace =
    destinations.find((destination) => destination.slug === selectedSlug) ??
    null;

  const frameAllDestinations = useCallback(() => {
    const map = mapRef.current;
    if (!map || destinations.length === 0) return;

    map.fitBounds(buildBounds(destinations), {
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 650,
      maxZoom: 4.7,
      padding: {
        top: 72,
        right: map.getContainer().clientWidth >= 1024 ? 72 : 36,
        bottom: map.getContainer().clientWidth >= 640 ? 72 : 190,
        left: map.getContainer().clientWidth >= 1024 ? 390 : 36,
      },
    });
  }, [destinations]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    configureMapLibreWorker();

    const map = new MapLibreMap({
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
      center: [5.8, 49.2],
      cooperativeGestures: true,
      dragRotate: false,
      maxPitch: 0,
      maxZoom: 13,
      minZoom: 2.2,
      pitchWithRotate: false,
      style: MAP_STYLE_URL,
      zoom: 3.5,
      container,
    });
    mapRef.current = map;

    map.addControl(
      new NavigationControl({ showCompass: false, showZoom: true }),
      "top-right",
    );
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    const markers = destinations.map((destination) => {
      const element = createMarkerElement(destination);
      const handleClick = (event: MouseEvent) => {
        event.stopPropagation();
        lastTriggerRef.current = element;
        setSelectedSlug(destination.slug);
      };
      element.addEventListener("click", handleClick);

      return {
        marker: new Marker({ anchor: "bottom", element })
          .setLngLat(toMapLibreLngLat(destination.coordinates))
          .addTo(map),
        element,
        handleClick,
      };
    });
    markersRef.current = markers;

    const handleLoad = () => {
      setMapError(false);
      frameAllDestinations();
    };
    const handleError = () => {
      if (!map.isStyleLoaded()) setMapError(true);
    };

    map.once("load", handleLoad);
    map.on("error", handleError);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      markers.forEach(({ marker, element, handleClick }) => {
        element.removeEventListener("click", handleClick);
        marker.remove();
      });
      markersRef.current = [];
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
    };
  }, [destinations, frameAllDestinations]);

  useEffect(() => {
    markersRef.current.forEach(({ element }, index) => {
      const active = destinations[index]?.slug === selectedSlug;
      element.dataset.active = String(active);
      element.setAttribute("aria-pressed", String(active));
    });

    const map = mapRef.current;
    const destination = destinations.find(
      (candidate) => candidate.slug === selectedSlug,
    );
    if (!map || !destination || !map.loaded()) return;

    map.easeTo({
      center: toMapLibreLngLat(destination.coordinates),
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 700,
      essential: false,
      zoom: Math.max(map.getZoom(), 5.2),
    });
  }, [destinations, selectedSlug]);

  function selectDestination(slug: string) {
    setSelectedSlug(slug);
    requestAnimationFrame(() => {
      mapContainerRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    });
  }

  function closePreview() {
    setSelectedSlug(null);
    frameAllDestinations();
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  return (
    <section className="map-experience" aria-label="V and G destination atlas">
      <div className="map-experience__stage">
        <div
          aria-label="Interactive map of five V and G destinations in Europe"
          className="size-full"
          ref={mapContainerRef}
          role="region"
        />

        <div className="map-experience__edition" aria-hidden="true">
          <span>V+G</span>
          <span>European atlas · 01</span>
        </div>

        {mapError ? (
          <div className="map-experience__error" role="status">
            <MapPin aria-hidden="true" size={22} />
            <div>
              <strong>The map tiles are temporarily unavailable.</strong>
              <span>
                The destination index below still reaches every memory.
              </span>
            </div>
          </div>
        ) : null}

        {selectedPlace ? (
          <article
            aria-labelledby={`map-preview-${selectedPlace.slug}`}
            aria-live="polite"
            className="map-place-preview"
            data-testid="map-place-preview"
          >
            <button
              aria-label="Close place preview"
              className="map-place-preview__close"
              onClick={closePreview}
              type="button"
            >
              <X aria-hidden="true" size={16} />
            </button>
            <div className="map-place-preview__image">
              <Image
                alt={selectedPlace.coverImage.alt}
                className="object-cover"
                fill
                sizes="(max-width: 639px) 7rem, 21rem"
                src={selectedPlace.coverImage.src}
              />
              <span>{selectedPlace.travelCode}</span>
            </div>
            <div className="map-place-preview__body">
              <p>{selectedPlace.country}</p>
              <h2 id={`map-preview-${selectedPlace.slug}`}>
                {selectedPlace.city}
              </h2>
              <time>{selectedPlace.dateRange.label}</time>
              <p>{selectedPlace.shortDescription}</p>
              <Link href={`/map/${selectedPlace.slug}`}>
                View memory
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </div>
          </article>
        ) : null}
      </div>

      <aside className="map-destination-index" aria-label="Destination index">
        <div className="map-destination-index__intro">
          <p>Accessible destination index</p>
          <h2>Five pins. No timeline.</h2>
          <span>
            Atlas order is editorial only and does not imply a travel route.
          </span>
        </div>

        <div className="map-destination-index__list">
          {destinations.map((destination) => {
            const active = destination.slug === selectedSlug;
            return (
              <div
                className="map-destination-row"
                data-active={active}
                key={destination.id}
              >
                <button
                  aria-label={`Locate ${destination.city} on the map`}
                  aria-pressed={active}
                  onClick={(event) => {
                    lastTriggerRef.current = event.currentTarget;
                    selectDestination(destination.slug);
                  }}
                  type="button"
                >
                  <span>{String(destination.atlasOrder).padStart(2, "0")}</span>
                  <span>
                    <strong>{destination.city}</strong>
                    <small>{destination.country}</small>
                  </span>
                  <LocateFixed aria-hidden="true" size={16} />
                </button>
                <Link
                  aria-label={`View ${destination.city} memory`}
                  href={`/map/${destination.slug}`}
                >
                  <ArrowUpRight aria-hidden="true" size={17} />
                </Link>
              </div>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
