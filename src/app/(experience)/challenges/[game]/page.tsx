import { Gamepad2, Timer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RouteScaffold } from "@/components/ui/route-scaffold";
import { challenges, getChallenge } from "@/data/challenges";

interface ChallengePageProps {
  params: Promise<{ game: string }>;
}

export function generateStaticParams() {
  return challenges.map((challenge) => ({ game: challenge.slug }));
}

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  const challenge = getChallenge((await params).game);
  return { title: challenge?.title ?? "Challenge" };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const challenge = getChallenge((await params).game);
  if (!challenge) notFound();

  return (
    <RouteScaffold
      description={challenge.description}
      eyebrow={`Challenge · ${challenge.format}`}
      icon="challenges"
      note="Question sets, scoring rules, animation states and persistence will live in this feature boundary."
      title={challenge.title}
    >
      <section className="mt-8 grid min-h-96 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/30 sm:mt-12 lg:grid-cols-[1fr_18rem]">
        <div className="grid place-items-center p-8 text-center">
          <div className="max-w-lg">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--ink)] text-[var(--paper)]">
              <Gamepad2 aria-hidden="true" size={24} />
            </span>
            <h2 className="mt-6 font-display text-4xl tracking-[-0.035em]">
              Game engine reserved.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The route, typed challenge registry and progress contract are in
              place. Final questions are intentionally not invented here.
            </p>
          </div>
        </div>
        <aside className="flex flex-col justify-between border-t border-[var(--line)] bg-[var(--paper-deep)] p-7 lg:border-t-0 lg:border-l">
          <Timer aria-hidden="true" size={20} />
          <div>
            <p className="text-[0.6rem] tracking-[0.15em] text-[var(--muted)] uppercase">
              Status
            </p>
            <p className="mt-2 font-display text-3xl">Content pending</p>
          </div>
        </aside>
      </section>
    </RouteScaffold>
  );
}
