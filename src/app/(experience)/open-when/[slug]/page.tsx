import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Sticker } from "@/components/design-system";
import { getOpenWhenLetter, openWhenLetters } from "@/data/open-when";
import { getExperienceReward } from "@/data/rewards";
import { LetterExperience } from "@/features/open-when/components/letter-experience";
import {
  isLetterOpened,
  isRewardClaimed,
} from "@/features/open-when/lib/open-when-domain";
import { getOpenWhenStateRepository } from "@/features/open-when/repositories/get-open-when-state-repository";
import { createRewardPresentation } from "@/features/rewards/lib/reward-domain";

interface LetterPageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return openWhenLetters.map((letter) => ({ slug: letter.slug }));
}

export async function generateMetadata({
  params,
}: LetterPageProps): Promise<Metadata> {
  const letter = getOpenWhenLetter((await params).slug);
  return {
    title: letter ? `Open when ${letter.title.toLowerCase()}` : "Letter",
    description: letter?.preview,
  };
}

export default async function LetterPage({ params }: LetterPageProps) {
  const letter = getOpenWhenLetter((await params).slug);
  if (!letter) notFound();

  const sequence = openWhenLetters.findIndex(
    (item) => item.slug === letter.slug,
  );
  const previous =
    openWhenLetters[
      (sequence - 1 + openWhenLetters.length) % openWhenLetters.length
    ];
  const next = openWhenLetters[(sequence + 1) % openWhenLetters.length];
  const state = await getOpenWhenStateRepository().get();
  const initialOpened = isLetterOpened(letter.slug, state);
  const initialOpenedCount = openWhenLetters.filter((item) =>
    state.openedLetters.some((openedLetter) => openedLetter.slug === item.slug),
  ).length;
  const rewardDefinition = letter.rewardId
    ? getExperienceReward(letter.rewardId)
    : undefined;
  const initialReward =
    initialOpened &&
    rewardDefinition &&
    isRewardClaimed(rewardDefinition.id, state)
      ? createRewardPresentation(rewardDefinition, false)
      : null;

  return (
    <div className="page-container py-7 sm:py-11 lg:py-16">
      <div className="open-when-detail-nav">
        <Link href="/open-when">
          <ArrowLeft aria-hidden="true" size={15} />
          All envelopes
        </Link>
        <Sticker
          rotation={2}
          size="sm"
          text={`Letter ${String(sequence + 1).padStart(2, "0")}`}
          variant="date"
        />
      </div>

      <header className="open-when-detail-heading">
        <p>Open when</p>
        <h1>{letter.title}.</h1>
        <span>{letter.preview}</span>
      </header>

      <LetterExperience
        initialOpened={initialOpened}
        initialOpenedCount={initialOpenedCount}
        initialReward={initialReward}
        letter={letter}
        sequence={sequence}
      />

      <nav aria-label="Other open when letters" className="letter-pagination">
        <Link href={`/open-when/${previous.slug}`}>
          <ArrowLeft aria-hidden="true" size={16} />
          <span>
            <small>Previous envelope</small>
            {previous.title}
          </span>
        </Link>
        <Link href={`/open-when/${next.slug}`}>
          <span>
            <small>Next envelope</small>
            {next.title}
          </span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </nav>
    </div>
  );
}
