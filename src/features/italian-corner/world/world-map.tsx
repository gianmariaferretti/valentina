import Image from "next/image";
import Link from "next/link";

import { worldById, worldStops } from "@/data/italian-world";

const markerPositions = [
  [42, 13],
  [57, 17],
  [35, 24],
  [58, 29],
  [42, 36],
  [61, 42],
  [38, 49],
  [64, 55],
  [47, 60],
  [68, 66],
  [46, 72],
  [65, 76],
  [43, 82],
  [62, 86],
  [45, 92],
] as const;

export function WorldMap({
  completedNumbers,
}: {
  completedNumbers: readonly number[];
}) {
  return (
    <section
      aria-labelledby="world-map-title"
      className="academy-world-section"
      id="world-map"
    >
      <div className="academy-world-heading">
        <div>
          <p className="academy-eyebrow">Un viaggio, una lingua</p>
          <h2 id="world-map-title">
            La Dolce Lingua <em>World.</em>
          </h2>
          <p>
            Learn Italian. Live Italy. Choose a stop, then keep the original
            lessons close at hand.
          </p>
        </div>
        <a className="academy-world-list-link academy-focus" href="#curriculum">
          Browse every published lesson ↗
        </a>
      </div>
      <div className="academy-world-layout">
        <div className="academy-world-art">
          <Image
            alt="Original illustrated adventure map of Italy with mountains, waterways, hill towns and a southern celebration"
            fill
            priority={false}
            sizes="(max-width: 900px) 100vw, 55vw"
            src="/images/academy/dolce-lingua-world-atlas.webp"
          />
          <div aria-hidden="true" className="academy-world-art-shade" />
          <div className="academy-world-markers">
            {worldStops.map((stop, index) => {
              const world = stop.worldId ? worldById[stop.worldId] : null;
              const complete = Array.from(
                { length: 10 },
                (_, offset) => stop.firstLesson + offset,
              ).every((number) => completedNumbers.includes(number));
              return stop.published ? (
                <Link
                  aria-label={`Stop ${String(stop.id).padStart(2, "0")}: lessons ${String(stop.firstLesson).padStart(3, "0")} to ${String(stop.lastLesson).padStart(3, "0")}${complete ? ", completed" : ""}`}
                  className={`academy-world-pin academy-focus ${complete ? "academy-world-pin--complete" : ""}`}
                  href={`/la-dolce-lingua/world/${stop.id}`}
                  key={stop.id}
                  style={{
                    left: `${markerPositions[index][0]}%`,
                    top: `${markerPositions[index][1]}%`,
                  }}
                  title={world?.name}
                >
                  {String(stop.id).padStart(2, "0")}
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className="academy-world-pin academy-world-pin--future"
                  key={stop.id}
                  style={{
                    left: `${markerPositions[index][0]}%`,
                    top: `${markerPositions[index][1]}%`,
                  }}
                >
                  ·
                </span>
              );
            })}
          </div>
        </div>
        <div className="academy-world-stops">
          {worldStops.map((stop) => {
            const world = stop.worldId ? worldById[stop.worldId] : null;
            const done = Array.from(
              { length: 10 },
              (_, offset) => stop.firstLesson + offset,
            ).filter((number) => completedNumbers.includes(number)).length;
            return stop.published ? (
              <Link
                className="academy-world-stop academy-focus"
                href={`/la-dolce-lingua/world/${stop.id}`}
                key={stop.id}
              >
                <span className="academy-world-stop-number">
                  {String(stop.id).padStart(2, "0")}
                </span>
                <span className="academy-world-stop-copy">
                  <strong>{world?.name}</strong>
                  <small>
                    Lessons {String(stop.firstLesson).padStart(3, "0")}–
                    {String(stop.lastLesson).padStart(3, "0")} · {done}/10
                    complete
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <div
                className="academy-world-stop academy-world-stop--future"
                key={stop.id}
              >
                <span className="academy-world-stop-number">
                  {String(stop.id).padStart(2, "0")}
                </span>
                <span className="academy-world-stop-copy">
                  <strong>Future chapter</strong>
                  <small>
                    Source lessons {String(stop.firstLesson).padStart(3, "0")}–
                    {String(stop.lastLesson).padStart(3, "0")} are under
                    editorial review
                  </small>
                </span>
                <span aria-hidden="true">—</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
