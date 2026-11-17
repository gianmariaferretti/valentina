import {
  arcPath,
  coverCities,
  coverCitiesPortrait,
  coverRoutes,
  type CoverCity,
} from "../lib/together";
import styles from "./cover.module.css";

type Points = Record<CoverCity, readonly [number, number]>;

function RouteMap({
  points,
  width,
  height,
  className,
}: {
  points: Points;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.lines} ${className}`}
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${width} ${height}`}
    >
      {coverRoutes.map(([from, to], index) => (
        <path
          className={styles.route}
          d={arcPath(points[from], points[to])}
          key={`${from}-${to}`}
          pathLength={1}
          style={{ ["--delay" as string]: `${0.6 + index * 0.9}s` }}
        />
      ))}
      {(Object.entries(points) as [CoverCity, readonly [number, number]][]).map(
        ([name, [x, y]]) => (
          <g key={name}>
            <circle className={styles.dot} cx={x} cy={y} r={3} />
            {/* Near the right edge the name goes on the left of the dot. */}
            <text
              className={styles.city}
              textAnchor={x > width * 0.78 ? "end" : "start"}
              x={x > width * 0.78 ? x - 8 : x + 8}
              y={y - 8}
            >
              {name}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}

/** Slowly drawn routes between our cities. Names only: the page is public. */
export function TravelLines() {
  return (
    <>
      <RouteMap
        className="sm:hidden"
        points={coverCitiesPortrait}
        height={1000}
        width={600}
      />
      <RouteMap
        className="hidden sm:block"
        points={coverCities}
        height={600}
        width={1000}
      />
    </>
  );
}
