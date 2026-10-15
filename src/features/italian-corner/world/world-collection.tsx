import {
  italianWorldCollectibles,
  collectibleDiscoveryId,
} from "@/data/italian-world-collectibles";

export function WorldCollection({
  unlocked,
  unavailable,
}: {
  unlocked: readonly string[];
  unavailable: boolean;
}) {
  const found = new Set(unlocked);
  return (
    <section
      aria-labelledby="world-collection-title"
      className="academy-collection"
    >
      <div className="academy-collection-heading">
        <div>
          <p className="academy-eyebrow">Piccoli tesori</p>
          <h2 id="world-collection-title">La collezione italiana.</h2>
          <p>
            Souvenirs from completed lessons, kept alongside—not instead of—your
            learning progress.
          </p>
        </div>
        <span>
          {unavailable ? "—" : found.size} / {italianWorldCollectibles.length}{" "}
          discovered
        </span>
      </div>
      {unavailable ? (
        <p role="status">
          The collection is temporarily unavailable. Your lessons remain
          accessible.
        </p>
      ) : null}
      <ol className="academy-collection-grid">
        {italianWorldCollectibles.map((item) => {
          const owned = found.has(collectibleDiscoveryId(item.id));
          return (
            <li
              className={`academy-collection-item ${owned ? "academy-collection-item--owned" : ""}`}
              key={item.id}
            >
              <span aria-hidden="true" className="academy-collection-mark">
                {owned ? item.mark : "?"}
              </span>
              <div>
                <strong>{owned ? item.name : "Un souvenir segreto"}</strong>
                <small>
                  {owned
                    ? item.place
                    : `Complete lesson ${String(item.lesson).padStart(3, "0")}`}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
