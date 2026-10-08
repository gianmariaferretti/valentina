import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getVgGame, retiredGameSlugs, vgGames } from "@/data/games";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";
import { GameExperience } from "@/features/games/components/game-experience";
interface Props {
  readonly params: Promise<{ game: string }>;
}
export function generateStaticParams() {
  return vgGames.map((game) => ({ game: game.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getVgGame((await params).game)?.title ?? "Arcade" };
}
export default async function ChallengePage({ params }: Props) {
  const slug = (await params).game;
  if ((retiredGameSlugs as readonly string[]).includes(slug))
    redirect("/challenges");
  const game = getVgGame(slug);
  if (!game) notFound();
  return (
    <GameExperience
      game={game}
      key={game.gameId}
      initialProgress={getChallengeProgress(
        game.gameId,
        await loadChallengeState(),
        game.difficulty,
      )}
    />
  );
}
