import {
  ArrowUpRight,
  Grid2X2,
  KeyRound,
  Layers,
  Shield,
  Square,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PaperCard, Sticker, Tape } from "@/components/design-system";
import { vgGames } from "@/data/games";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";
import { formatGameTime } from "@/features/games/lib/arcade-random";
import styles from "@/features/games/components/games.module.css";
export const metadata: Metadata = {
  title: "V&G Arcade",
  description:
    "Five precision, logic and survival games in the private Year One archive.",
};
const icons = [Shield, Grid2X2, Layers, Square, KeyRound];
export default async function ChallengesPage() {
  const state = await loadChallengeState(),
    records = vgGames.map((game) =>
      getChallengeProgress(game.gameId, state, game.difficulty),
    );
  const completed = records.filter(
    (record) =>
      record.wins > 0 ||
      ((record.gameId === "snake" || record.gameId === "maze") &&
        record.completedAt),
  ).length;
  return (
    <div className={styles.gamesSurface}>
      <div className="page-container py-6 sm:py-10 lg:py-14">
        <header className={styles.collectionHero}>
          <p>V&amp;G / PRIVATE ARCADE</p>
          <h1>
            Five games.
            <br />
            <em>No shortcuts.</em>
          </h1>
          <span>
            A little precision. A lot of patience.
            <br />
            The rewards stay in your wallet.
          </span>
          <Sticker
            size="sm"
            variant="classified"
            text="PLAYABLE ARCHIVE"
            rotation={-3}
          />
        </header>
        <dl className={styles.collectionStats}>
          <div>
            <dt>Completed</dt>
            <dd>{completed} / 5</dd>
          </div>
          <div>
            <dt>Wins</dt>
            <dd>{records.reduce((sum, record) => sum + record.wins, 0)}</dd>
          </div>
          <div>
            <dt>Attempts</dt>
            <dd>{records.reduce((sum, record) => sum + record.attempts, 0)}</dd>
          </div>
        </dl>
        <section
          className={styles.gameCollection}
          aria-label="Five arcade games"
        >
          {vgGames.map((game, index) => {
            const record = records[index],
              Icon = icons[index],
              won =
                record.wins > 0 ||
                ((game.engine === "snake" || game.engine === "maze") &&
                  record.completedAt);
            const best =
              game.metric === "time"
                ? record.bestTimeMs == null
                  ? "—"
                  : formatGameTime(record.bestTimeMs)
                : game.engine === "snake"
                  ? Math.floor(record.bestScore / 10)
                  : record.bestScore;
            return (
              <PaperCard
                key={game.gameId}
                className={styles.gameCollectionCard}
                elevated={index === 0}
                texture={index % 2 === 0 ? "ruled" : "plain"}
              >
                <Tape
                  position="top-right"
                  size="sm"
                  rotation={index % 2 ? 2 : -2}
                />
                <div className={styles.gameCardTopline}>
                  <span>{game.number} / 05</span>
                  <Sticker
                    size="sm"
                    variant={won ? "girlfriend-approved" : "classified"}
                    text={won ? "COMPLETED" : "NOT COMPLETED"}
                    rotation={index % 2 ? 2 : -2}
                  />
                </div>
                <Icon aria-hidden="true" className={styles.gameCardIcon} />
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <dl className={styles.gameCardProgress}>
                  <div>
                    <dt>Best {game.metric === "time" ? "time" : "score"}</dt>
                    <dd>{best}</dd>
                  </div>
                  <div>
                    <dt>Attempts</dt>
                    <dd>{record.attempts}</dd>
                  </div>
                </dl>
                <Link href={`/challenges/${game.slug}`}>
                  PLAY <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </PaperCard>
            );
          })}
        </section>
      </div>
    </div>
  );
}
