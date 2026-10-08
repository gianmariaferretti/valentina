import { LockKeyhole, Trophy } from "lucide-react";
import type { Metadata } from "next";

import { PaperCard, Sticker } from "@/components/design-system";
import { RouteScaffold } from "@/components/ui/route-scaffold";
import { vgGames } from "@/data/games";
import { quizAchievementRule } from "@/data/quiz";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";
import { loadQuizState } from "@/features/quiz/repositories/get-quiz-state-repository";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const [quizState, gameState] = await Promise.all([
    loadQuizState(),
    loadChallengeState(),
  ]);
  const quizAchievementUnlocked = quizAchievementRule
    ? quizState.unlockedAchievementIds.includes(
        quizAchievementRule.achievement.id,
      )
    : false;

  return (
    <RouteScaffold
      description="Milestones awarded for long-distance logistics, elite snack theft and other measurable relationship excellence."
      eyebrow="Progress, gamified unnecessarily"
      icon="achievements"
      note="Achievements are granted once and archived across devices. Game badges and four visual-novel milestones are hidden inside V&G Games."
      title="Badges for surviving us."
    >
      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vgGames.flatMap((game) =>
          game.rewards
            .filter((reward) => reward.kind === "achievement")
            .map((achievement) => {
              const record = getChallengeProgress(
                game.gameId,
                gameState,
                game.difficulty,
              );
              const unlocked = record.unlockedRewards.includes(achievement.id);
              return (
                <AchievementCard
                  description={achievement.description}
                  eyebrow={`${game.number} · ${game.shortTitle}`}
                  key={achievement.id}
                  title={achievement.title}
                  unlocked={unlocked}
                />
              );
            }),
        )}

        {quizAchievementRule ? (
          <AchievementCard
            description={quizAchievementRule.achievement.description}
            eyebrow="The Boyfriend Exam"
            lockedCopy="Reach the required quiz score to open this record."
            title={quizAchievementRule.achievement.title}
            unlocked={quizAchievementUnlocked}
          />
        ) : null}
      </section>
    </RouteScaffold>
  );
}

function AchievementCard({
  description,
  eyebrow,
  lockedCopy = "Complete the associated game file to reveal this record.",
  title,
  unlocked,
}: {
  readonly description: string;
  readonly eyebrow: string;
  readonly lockedCopy?: string;
  readonly title: string;
  readonly unlocked: boolean;
}) {
  return (
    <PaperCard
      className="relative flex min-h-64 flex-col overflow-hidden p-6"
      tone={unlocked ? "burgundy" : "white"}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-full border border-current/20">
          {unlocked ? (
            <Trophy aria-hidden="true" size={19} />
          ) : (
            <LockKeyhole aria-hidden="true" size={18} />
          )}
        </span>
        <Sticker
          rotation={unlocked ? -3 : 2}
          size="sm"
          text={unlocked ? "Earned" : "Sealed"}
          variant={unlocked ? "girlfriend-approved" : "classified"}
        />
      </div>
      <div className="mt-auto pt-12">
        <p className="text-[0.58rem] font-bold tracking-[0.16em] uppercase opacity-55">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 opacity-60">
          {unlocked ? description : lockedCopy}
        </p>
      </div>
    </PaperCard>
  );
}
