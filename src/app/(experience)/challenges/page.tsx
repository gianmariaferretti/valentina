import { ArrowUpRight, Gamepad2, LockKeyhole, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { arcadeChallenges } from "@/data/challenges";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";

export const metadata: Metadata = {
  title: "Impossible Coupon Challenge",
  description: "The hidden V&G arcade. Impossible coupons are earned here.",
};

function formatScore(score: number): string {
  return new Intl.NumberFormat("en-GB").format(score);
}

export default async function ChallengesPage() {
  const state = await loadChallengeState();

  return (
    <div className="arcade-surface min-h-[calc(100svh-7rem)] text-white">
      <div className="page-container py-12 sm:py-16 lg:py-24">
        <header className="grid items-end gap-10 border-b border-white/12 pb-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <p className="arcade-pixel text-[0.62rem] tracking-[0.22em] text-[#ff5d8f]">
              V&amp;G ARCADE · RESTRICTED FLOOR
            </p>
            <h1 className="mt-6 max-w-5xl text-[clamp(3rem,9vw,7.8rem)] leading-[0.86] font-black tracking-[-0.07em] uppercase">
              Impossible coupon challenge
            </h1>
          </div>
          <div className="lg:pb-2">
            <Gamepad2 aria-hidden="true" className="text-white/35" size={30} />
            <p className="mt-6 text-xl leading-8 text-white/62">
              You want the coupon? Earn it.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/38">
              No shortcuts, no mysteriously generous scoring and absolutely no
              appeals to management.
            </p>
          </div>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-label="Games">
          {arcadeChallenges.map((challenge, index) => {
            const progress = getChallengeProgress(challenge.slug, state);
            const complete = progress.completedAt !== null;
            const accent = challenge.accent === "acid" ? "#a7ff4e" : "#39cfff";

            return (
              <Link
                className="arcade-challenge-card group"
                data-accent={challenge.accent}
                href={`/challenges/${challenge.slug}`}
                key={challenge.slug}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="arcade-pixel text-[0.56rem] tracking-[0.16em]"
                    style={{ color: accent }}
                  >
                    GAME 0{index + 1} · {challenge.format}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="text-white/38 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    size={22}
                  />
                </div>

                <div className="mt-16 sm:mt-24">
                  <div
                    className="mb-5 grid size-12 place-items-center rounded-xl border"
                    style={{ borderColor: `${accent}50`, color: accent }}
                  >
                    {complete ? (
                      <Trophy aria-hidden="true" size={21} />
                    ) : (
                      <LockKeyhole aria-hidden="true" size={20} />
                    )}
                  </div>
                  <h2 className="text-4xl font-black tracking-[-0.045em] uppercase sm:text-5xl">
                    {challenge.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">
                    {challenge.description}
                  </p>
                </div>

                <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
                  {[
                    ["Required", formatScore(challenge.requiredScore)],
                    ["Best", formatScore(progress.bestScore)],
                    ["Attempts", formatScore(progress.attempts)],
                    ["Status", complete ? "Unlocked" : "Locked"],
                  ].map(([label, value]) => (
                    <div className="bg-[#081016] p-3.5" key={label}>
                      <dt className="text-[0.5rem] font-bold tracking-[0.14em] text-white/32 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-1.5 text-xs font-bold text-white/78">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 border-t border-dashed border-white/12 pt-5">
                  <p className="text-[0.54rem] font-bold tracking-[0.14em] text-white/32 uppercase">
                    Reward
                  </p>
                  <p
                    className="mt-2 text-sm font-bold"
                    style={{ color: accent }}
                  >
                    {challenge.reward}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>

        <p className="mt-8 text-center text-[0.58rem] font-bold tracking-[0.16em] text-white/28 uppercase">
          Scores are archived · Pride is not recoverable
        </p>
      </div>
    </div>
  );
}
