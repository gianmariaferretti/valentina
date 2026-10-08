import type { Metadata } from "next";

import {
  DoodleArrow,
  HandwrittenNote,
  PaperCard,
  Sticker,
  Tape,
} from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";
import { gameSecretNotes, masterArchiveFile } from "@/data/game-secrets";
import { vgGames } from "@/data/games";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";
import { getRecoveredGameRewards } from "@/features/games/lib/game-domain";

export const metadata: Metadata = { title: "Secret" };

export default async function SecretPage() {
  const recovered = getRecoveredGameRewards(
    vgGames,
    await loadChallengeState(),
  );
  const items = recovered.filter((reward) => reward.kind === "item");
  const secrets = recovered.filter((reward) => reward.kind === "secret");
  const itemIds = new Set(items.map((reward) => reward.targetId));
  const clearance = masterArchiveFile.requiredItemIds.every((id) =>
    itemIds.has(id),
  );

  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        description="A route hidden in plain sight, reserved for the experience’s least predictable idea."
        eyebrow="Nothing to see here"
        title="This is definitely not the secret."
      />
      <PaperCard
        className="mt-8 grid min-h-[34rem] place-items-center p-8 text-center sm:mt-12"
        elevated
        tone="ink"
      >
        <Tape position="top" rotation={-3} tone="burgundy" />
        <div className="absolute top-6 right-6">
          <Sticker size="sm" variant="top-secret" />
        </div>
        <div className="max-w-xl">
          <Sticker rotation={4} size="lg" variant="do-not-open" />
          <h2 className="mt-10 font-display text-5xl tracking-[-0.045em] text-[var(--paper)] sm:text-7xl">
            Classified for excellent reasons.
          </h2>
          <HandwrittenNote className="mt-8 block" rotation={-2} tone="paper">
            asking again will not improve your clearance level
          </HandwrittenNote>
          <DoodleArrow
            className="mt-10"
            label="suspiciously empty"
            tone="sand"
          />
        </div>
      </PaperCard>
      <section aria-labelledby="recovered-files" className="mt-12">
        <h2 className="font-display text-3xl sm:text-4xl" id="recovered-files">
          Recovered from the games.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Keys and notes stay in your private archive across devices. Only saved
          rewards count towards clearance.
        </p>
        {items.length + secrets.length === 0 ? (
          <p className="mt-6 text-sm">
            No recovered evidence. The games are suspiciously quiet.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...items, ...secrets].map((reward) => (
              <PaperCard className="p-6" key={reward.id}>
                <Sticker
                  size="sm"
                  text={
                    reward.kind === "item"
                      ? "Evidence collected"
                      : "Declassified"
                  }
                  variant="classified"
                />
                <h3 className="mt-5 font-display text-2xl">{reward.title}</h3>
                <p className="mt-3 text-sm leading-7">
                  {gameSecretNotes[reward.targetId] ?? reward.description}
                </p>
              </PaperCard>
            ))}
          </div>
        )}
      </section>
      <PaperCard className="mt-10 p-6 sm:p-10" texture="ruled">
        <Sticker
          size="sm"
          variant={clearance ? "girlfriend-approved" : "top-secret"}
        />
        <h2 className="mt-6 font-display text-3xl sm:text-5xl">
          {clearance
            ? masterArchiveFile.title
            : "The final file needs three keys."}
        </h2>
        {clearance ? (
          masterArchiveFile.paragraphs.map((paragraph) => (
            <p className="mt-5 max-w-2xl text-base leading-8" key={paragraph}>
              {paragraph}
            </p>
          ))
        ) : (
          <p className="mt-5 max-w-xl text-sm leading-7">
            The Great Escape, Break My Defences and 365 Memories each hold a
            piece of the clearance. Bring all three back to this desk.
          </p>
        )}
      </PaperCard>
    </div>
  );
}
