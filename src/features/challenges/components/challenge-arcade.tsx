"use client";

import { ArrowLeft, Check, LockKeyhole, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { recordChallengeResult } from "@/features/challenges/actions/record-challenge-result";
import { MazeGame } from "@/features/challenges/components/maze-game";
import { SnakeGame } from "@/features/challenges/components/snake-game";
import type {
  ArcadeChallengeDefinition,
  ChallengeProgress,
} from "@/features/challenges/types";

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-GB").format(score);
}

export function ChallengeArcade({
  challenge,
  initialProgress,
}: {
  challenge: ArcadeChallengeDefinition;
  initialProgress: ChallengeProgress;
}) {
  const router = useRouter();
  const [currentScore, setCurrentScore] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const persistRun = useCallback(
    async (score: number) => {
      setIsSaving(true);
      setFeedback(null);

      try {
        const result = await recordChallengeResult(challenge.slug, score);
        if (result.status === "success" && result.progress) {
          setProgress(result.progress);
          setFeedback(result.message);
          router.refresh();
        } else {
          setFeedback(result.message);
        }
      } catch {
        setFeedback("The archive hiccupped. Your score is still on screen.");
      } finally {
        setIsSaving(false);
      }
    },
    [challenge.slug, router],
  );

  const handleRunEnd = useCallback(
    (score: number) => {
      void persistRun(score);
    },
    [persistRun],
  );

  const completed = progress.completedAt !== null;
  const accent = challenge.accent === "acid" ? "#a7ff4e" : "#39cfff";

  const stats = [
    { label: "Current challenge", value: challenge.shortTitle },
    { label: "Required score", value: formatScore(challenge.requiredScore) },
    { label: "Current score", value: formatScore(currentScore) },
    { label: "Best score", value: formatScore(progress.bestScore) },
    { label: "Attempts", value: formatScore(progress.attempts) },
    { label: "Reward", value: challenge.reward },
  ] as const;

  return (
    <div className="arcade-surface min-h-[calc(100svh-7rem)] text-white">
      <div className="page-container py-8 sm:py-12 lg:py-16">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-[0.62rem] font-bold tracking-[0.14em] text-white/65 uppercase transition hover:border-white/35 hover:text-white"
          href="/challenges"
        >
          <ArrowLeft aria-hidden="true" size={15} />
          Challenge select
        </Link>

        <header className="mt-9 grid items-end gap-7 border-b border-white/12 pb-9 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p
              className="arcade-pixel text-[0.62rem] tracking-[0.22em]"
              style={{ color: accent }}
            >
              V&amp;G ARCADE · LEVEL 01
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,8vw,6.6rem)] leading-[0.88] font-black tracking-[-0.065em] uppercase">
              Impossible coupon challenge
            </h1>
          </div>
          <div className="lg:pb-2">
            <p className="text-lg leading-7 text-white/60">
              You want the coupon? Earn it.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              <span
                className="size-2 rounded-full shadow-[0_0_14px_currentColor]"
                style={{ backgroundColor: accent, color: accent }}
              />
              {completed ? "Reward unlocked" : challenge.difficulty}
            </div>
          </div>
        </header>

        <section
          aria-label="Challenge status"
          className="grid border-b border-white/12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          {stats.map((stat) => (
            <div
              className="min-w-0 border-white/12 py-5 pr-4 sm:border-r sm:px-5 sm:first:pl-0 sm:nth-[2n]:border-r-0 lg:nth-[2n]:border-r xl:border-r xl:last:border-r-0"
              key={stat.label}
            >
              <p className="text-[0.55rem] font-bold tracking-[0.16em] text-white/38 uppercase">
                {stat.label}
              </p>
              <p className="mt-2 truncate text-sm font-bold text-white/88">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          {challenge.kind === "snake" ? (
            <SnakeGame
              attempts={progress.attempts}
              onRunEnd={handleRunEnd}
              onScoreChange={setCurrentScore}
              requiredScore={challenge.requiredScore}
            />
          ) : (
            <MazeGame
              attempts={progress.attempts}
              onRunEnd={handleRunEnd}
              onScoreChange={setCurrentScore}
              requiredScore={challenge.requiredScore}
            />
          )}

          <aside className="grid gap-4 xl:sticky xl:top-32">
            <div className="rounded-2xl border border-white/12 bg-white/[0.035] p-6">
              <p
                className="arcade-pixel text-[0.58rem]"
                style={{ color: accent }}
              >
                MISSION BRIEF
              </p>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] uppercase">
                {challenge.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/52">
                {challenge.description}
              </p>
              <ol className="mt-6 grid gap-4 border-t border-white/10 pt-5">
                {challenge.instructions.map((instruction, index) => (
                  <li
                    className="grid grid-cols-[1.6rem_1fr] gap-2 text-xs leading-5 text-white/58"
                    key={instruction}
                  >
                    <span className="font-bold" style={{ color: accent }}>
                      0{index + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: `${accent}45`,
                backgroundColor: `${accent}0c`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  {completed ? (
                    <Trophy aria-hidden="true" size={17} />
                  ) : (
                    <LockKeyhole aria-hidden="true" size={17} />
                  )}
                </span>
                <div>
                  <p className="text-[0.56rem] font-bold tracking-[0.15em] text-white/42 uppercase">
                    Reward status
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {completed ? "Coupon unlocked" : challenge.reward}
                  </p>
                </div>
              </div>
              {completed ? (
                <Link
                  className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-[0.62rem] font-black tracking-[0.13em] text-[#071018] uppercase"
                  href={`/coupons/${challenge.rewardCouponId}`}
                >
                  <Check aria-hidden="true" size={15} />
                  View coupon
                </Link>
              ) : null}
            </div>

            <p
              aria-live="polite"
              className="min-h-5 px-2 text-xs leading-5 text-white/45"
            >
              {isSaving ? "Archiving attempt…" : feedback}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
