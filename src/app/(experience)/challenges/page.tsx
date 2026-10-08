import {
  ArrowUpRight,
  CalendarRange,
  Footprints,
  HeartPulse,
  Images,
  KeyRound,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PaperCard, Sticker, Tape } from "@/components/design-system";
import { arcadeChallenges } from "@/data/challenges";
import { vgGames } from "@/data/games";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";

import styles from "@/features/games/components/games.module.css";

export const metadata: Metadata = {
  title: "V&G Games",
  description: "Seven private games hidden inside the Year One archive.",
};

const gameIcons = [
  Footprints,
  Search,
  HeartPulse,
  Shield,
  CalendarRange,
  KeyRound,
  Images,
] as const;

export default async function ChallengesPage() {
  const state = await loadChallengeState();
  const progress = vgGames.map((game) =>
    getChallengeProgress(game.gameId, state, game.difficulty),
  );
  const completed = progress.filter((record) => record.completedAt).length;
  const wins = progress.reduce((total, record) => total + record.wins, 0);
  const rewards = new Set(progress.flatMap((record) => record.unlockedRewards))
    .size;

  return (
    <div className={styles.gamesSurface}>
      <div className="page-container py-6 sm:py-10 lg:py-14">
        <header className={styles.collectionHero}>
          <div>
            <p>V&amp;G Games Department · Private collection</p>
            <h1>
              Seven games.
              <br />
              <em>One suspicious archive.</em>
            </h1>
            <span>
              Built for two people, one year and a completely reasonable amount
              of classified paperwork.
            </span>
          </div>
          <div className={styles.heroSpark} aria-hidden="true">
            <Sparkles />
            <span>Playable evidence</span>
          </div>
        </header>

        <dl
          className={styles.collectionStats}
          aria-label="Games archive progress"
        >
          <div>
            <dt>Files closed</dt>
            <dd>{completed} / 07</dd>
          </div>
          <div>
            <dt>Successful operations</dt>
            <dd>{wins}</dd>
          </div>
          <div>
            <dt>Rewards recovered</dt>
            <dd>{rewards}</dd>
          </div>
        </dl>

        <section className={styles.gameCollection} aria-label="V&G games">
          {vgGames.map((game, index) => {
            const Icon = gameIcons[index];
            const record = progress[index];
            return (
              <PaperCard
                className={styles.gameCollectionCard}
                elevated={index === 0 || index === 6}
                key={game.gameId}
                texture={index % 2 === 0 ? "ruled" : "plain"}
              >
                <Tape
                  position={index % 2 === 0 ? "top-left" : "top-right"}
                  rotation={index % 2 === 0 ? -3 : 2}
                  size="sm"
                  tone={index === 6 ? "burgundy" : "cream"}
                />
                <div className={styles.gameCardTopline}>
                  <span>{game.number} / 07</span>
                  <Sticker
                    rotation={index % 2 === 0 ? 2 : -2}
                    size="sm"
                    text={
                      record.completedAt ? "File closed" : game.dossierLabel
                    }
                    variant={
                      record.completedAt ? "girlfriend-approved" : "classified"
                    }
                  />
                </div>
                <div className={styles.gameCardIcon} data-accent={game.accent}>
                  <Icon aria-hidden="true" />
                </div>
                <p>{game.objective}</p>
                <h2>{game.title}</h2>
                <div className={styles.gameCardProgress}>
                  <span>
                    <i style={{ width: `${record.progress}%` }} />
                  </span>
                  <dl>
                    <div>
                      <dt>Best</dt>
                      <dd>{record.bestScore.toLocaleString("en-GB")}</dd>
                    </div>
                    <div>
                      <dt>Attempts</dt>
                      <dd>{record.attempts}</dd>
                    </div>
                  </dl>
                </div>
                <Link href={`/challenges/${game.slug}`}>
                  Open game file <ArrowUpRight aria-hidden="true" />
                </Link>
              </PaperCard>
            );
          })}
        </section>

        <aside className={styles.impossibleAnnex}>
          <div>
            <p>Legacy annex · Still legally impossible</p>
            <h2>The original challenges remain in the basement.</h2>
          </div>
          <div>
            {arcadeChallenges.map((challenge) => (
              <Link href={`/challenges/${challenge.slug}`} key={challenge.slug}>
                {challenge.title}
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
