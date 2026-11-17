import type { LatLng } from "./geo.ts";
import {
  globeId,
  staggerLabels,
  type GlobeArc,
  type GlobePoint,
} from "./types.ts";

export interface GlobeCity {
  readonly name: string;
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly who: string;
}

const distance = (a: LatLng, b: LatLng) =>
  Math.hypot(a[0] - b[0], (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180));

/**
 * Points and arcs for the home globe. The first arc joins Valentina's city
 * and Gianmaria's; every other city is joined to the nearer of the two.
 */
export function cityGlobe(
  cities: readonly GlobeCity[],
  badges: Readonly<Record<string, string>> = {},
  weather: Readonly<Record<string, { icon: string; label: string }>> = {},
): { points: GlobePoint[]; arcs: GlobeArc[] } {
  const seen = new Set<string>();
  const raw = cities.map((city) => {
    let id = globeId(city.name);
    while (seen.has(id)) id += "-x";
    seen.add(id);
    return {
      id,
      name: city.name,
      location: [city.latitude, city.longitude] as LatLng,
      timeZone: city.timeZone,
      badge: badges[city.name],
      weather: weather[city.name],
    };
  });
  const points: GlobePoint[] = staggerLabels(raw);
  const byWho = (who: string) =>
    points[cities.findIndex((c) => c.who.trim().toLowerCase() === who)];
  const her = byWho("valentina");
  const him = byWho("gianmaria");
  const arcs: GlobeArc[] = [];
  if (her && him)
    arcs.push({
      id: `${her.id}--${him.id}`,
      from: her.location,
      to: him.location,
    });
  const hubs = [her, him].filter(Boolean) as GlobePoint[];
  for (const point of points) {
    if (hubs.includes(point) || hubs.length === 0) continue;
    const hub = hubs.reduce((best, h) =>
      distance(h.location, point.location) <
      distance(best.location, point.location)
        ? h
        : best,
    );
    if (distance(hub.location, point.location) < 0.01) continue;
    arcs.push({
      id: `${point.id}--${hub.id}`,
      from: point.location,
      to: hub.location,
    });
  }
  return { points, arcs };
}
