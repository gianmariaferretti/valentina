import {
  endingSecretId,
  relationshipEndings,
} from "@/data/relationship-endings";
import styles from "./novel.module.css";

export function EndingsArchive({
  archivedSecrets,
}: {
  readonly archivedSecrets: readonly string[];
}) {
  const unlocked = relationshipEndings.filter((ending) =>
    archivedSecrets.includes(endingSecretId(ending.id)),
  );
  return (
    <details className={styles.archive}>
      <summary>
        ENDINGS ARCHIVE <span>{unlocked.length} / 10 discovered</span>
      </summary>
      <p>
        Only successfully saved endings appear here. Every day is a different
        version of the same team.
      </p>
      <ol>
        {relationshipEndings.map((ending, index) => {
          const discovered = unlocked.some((item) => item.id === ending.id);
          return (
            <li key={ending.id} data-discovered={discovered}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{discovered ? ending.title : "Sealed ending"}</h3>
                <p>
                  {discovered
                    ? ending.description
                    : "Replay the day to discover this record."}
                </p>
                {discovered && "footnote" in ending ? (
                  <small>{ending.footnote}</small>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
