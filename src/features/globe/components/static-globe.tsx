import { arcPath, centerOf, project, type LatLng } from "../lib/geo";
import type { GlobeProps } from "../lib/types";

const R = 100;

function graticule(center: LatLng): string[] {
  const lines: string[] = [];
  const add = (points: LatLng[]) => {
    let d = "";
    let pen = false;
    for (const point of points) {
      const p = project(point, center, R);
      if (!p.visible) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      pen = true;
    }
    if (d) lines.push(d);
  };
  for (let lng = -180; lng < 180; lng += 30)
    add(Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lng] as LatLng));
  for (let lat = -60; lat <= 60; lat += 30)
    add(Array.from({ length: 73 }, (_, i) => [lat, -180 + i * 5] as LatLng));
  return lines;
}

/**
 * The static globe: an SVG illustration with the same points and arcs. It
 * is the version for reduced motion, low battery and no WebGL, and the
 * placeholder while the live globe loads.
 */
export function StaticGlobe({
  points,
  arcs = [],
  plane,
  theme = "paper",
  label,
  showLabels = true,
}: GlobeProps) {
  const center = centerOf(points.map((p) => p.location));
  const night = theme === "night";
  const stroke = night ? "rgba(244,231,211,0.16)" : "rgba(36,30,28,0.12)";
  const ink = night ? "#f4e7d3" : "#241e1c";
  const arcColor = night ? "#d6a64b" : "#93463e";
  const id = night ? "globe-night" : "globe-paper";
  return (
    <svg
      aria-label={label}
      className="size-full overflow-visible"
      role="img"
      viewBox={`-8 -8 ${R * 2 + 16} ${R * 2 + 16}`}
    >
      <defs>
        <radialGradient cx="38%" cy="32%" id={id} r="75%">
          <stop offset="0%" stopColor={night ? "#4a2b31" : "#fffdf9"} />
          <stop offset="100%" stopColor={night ? "#1b1416" : "#e6dccd"} />
        </radialGradient>
      </defs>
      <circle cx={R} cy={R} fill={`url(#${id})`} r={R} />
      {graticule(center).map((d) => (
        <path d={d} fill="none" key={d} stroke={stroke} strokeWidth={0.6} />
      ))}
      <circle cx={R} cy={R} fill="none" r={R} stroke={stroke} />
      {arcs.map((arc) => (
        <path
          d={arcPath(arc.from, arc.to, center, R)}
          fill="none"
          key={arc.id}
          stroke={arcColor}
          strokeLinecap="round"
          strokeWidth={1.4}
        />
      ))}
      {plane ? (
        <path
          d={arcPath(plane.from, plane.to, center, R)}
          fill="none"
          stroke={arcColor}
          strokeDasharray="3 3"
          strokeWidth={1.2}
        />
      ) : null}
      {points.map((point) => {
        const p = project(point.location, center, R);
        if (!p.visible) return null;
        return (
          <g key={point.id}>
            <circle
              cx={p.x}
              cy={p.y}
              fill={night ? "#d6a64b" : "#8c1c34"}
              r={2.6}
            />
            {showLabels && !point.quiet ? (
              <text
                className="max-sm:group-data-[compact=true]/globe:hidden"
                fill={ink}
                fontSize={7}
                letterSpacing="0.06em"
                opacity={0.8}
                x={p.x + 4}
                y={point.below ? p.y + 9 : p.y - 4}
              >
                {point.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
