import type { Doodle } from "../lib/doodles";
import styles from "./doodles.module.css";

const when = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Rome",
});

/** Polaroids of every doodle, newest first. Private PNGs, never cached. */
export function DoodleAlbum({
  doodles,
  fileBase,
  viewer,
  renderActions,
}: {
  doodles: readonly Doodle[];
  /** "/api/doodles" for Valentina, "/admin/disegni/file" in the panel. */
  fileBase: string;
  viewer: "valentina" | "gianmaria";
  renderActions?: (doodle: Doodle) => React.ReactNode;
}) {
  return (
    <ul className={styles.album}>
      {doodles.map((doodle, index) => {
        const mine = doodle.author === viewer;
        const who =
          viewer === "valentina"
            ? mine
              ? "For Gianmaria"
              : "From Gianmaria"
            : mine
              ? "Per Valentina"
              : "Da Valentina";
        const src = `${fileBase}/${doodle.id}/preview`;
        return (
          <li key={doodle.id}>
            <figure
              className={styles.polaroid}
              style={{ transform: `rotate(${((index * 37) % 7) - 3}deg)` }}
            >
              <a href={src} rel="noopener" target="_blank">
                {/* Private PNG behind the session: no image optimizer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Doodle ${who.toLowerCase()}, ${when.format(new Date(doodle.createdAt))}`}
                  height={300}
                  loading={index < 4 ? "eager" : "lazy"}
                  src={src}
                  width={300}
                />
              </a>
              <figcaption className={styles.caption}>
                {doodle.favorite ? "⭐ " : ""}
                {who} · {when.format(new Date(doodle.createdAt))}
                {doodle.replyTo ? " · reply" : ""}
              </figcaption>
            </figure>
            {renderActions ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {renderActions(doodle)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
