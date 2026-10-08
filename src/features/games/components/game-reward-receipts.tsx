import { ArrowUpRight, Award, KeyRound, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";

import { Sticker } from "@/components/design-system";
import type { GameRewardKind, GameRewardReceipt } from "@/features/games/types";

import styles from "./games.module.css";

const rewardIcons: Record<GameRewardKind, typeof Award> = {
  achievement: Award,
  coupon: Ticket,
  discovery: Sparkles,
  secret: KeyRound,
  item: KeyRound,
};

export function GameRewardReceipts({
  rewards,
}: {
  readonly rewards: readonly GameRewardReceipt[];
}) {
  if (rewards.length === 0) return null;

  return (
    <section
      className={styles.rewardReceipts}
      aria-labelledby="game-rewards-title"
    >
      <div>
        <p>Archive transfer</p>
        <h2 id="game-rewards-title">Rewards recovered</h2>
      </div>
      <div className={styles.rewardReceiptGrid}>
        {rewards.map((reward) => {
          const Icon = rewardIcons[reward.kind];
          return (
            <article key={reward.id}>
              <div>
                <Icon aria-hidden="true" size={21} />
                <Sticker
                  rotation={reward.newlyGranted ? -3 : 2}
                  size="sm"
                  text={reward.newlyGranted ? "New evidence" : "Already filed"}
                  variant={reward.newlyGranted ? "legendary" : "classified"}
                />
              </div>
              <h3>{reward.title}</h3>
              <p>{reward.description}</p>
              <Link href={reward.href}>
                Inspect record <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
