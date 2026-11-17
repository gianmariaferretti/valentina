import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HandwrittenNote } from "@/components/design-system";
import { casinoConfig as config } from "@/data/casino-config";
import { loadCurtainMessage } from "@/features/admin/repositories/content";
import { FinaleClaim } from "@/features/casino/components/finale-claim";
import { loadCasinoSnapshot } from "@/features/casino/repositories/load-casino";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Behind the Curtain",
};

const percent = (value: number) =>
  `${(value * 100).toFixed(value < 0.01 ? 1 : 0)}%`;

export default async function BehindTheCurtainPage() {
  await requireAccessSession();
  const [snapshot, curtainMessage] = await Promise.all([
    loadCasinoSnapshot(),
    loadCurtainMessage(),
  ]);
  if (snapshot.failed || !snapshot.state.curtain.unlocked) notFound();
  const { stats, curtain } = snapshot.state;
  const returned = stats.wagered > 0 ? stats.kissesWon / stats.wagered : 0;
  const odds = config.couponOdds;
  const slotRtp = config.slots.outcomes.reduce(
    (sum, outcome) => sum + outcome.probability * outcome.multiplier,
    0,
  );

  const numbers = [
    ["Plays", stats.plays],
    ["Kisses played", stats.wagered],
    ["Kisses won back", stats.kissesWon],
    ["Coupons won", stats.couponsWon],
    ["Near misses shown to you", stats.nearMisses],
    ["Losses dressed up as wins", stats.disguisedLosses],
    ["Real kisses bought", stats.realKissesBought],
    ["Real kisses paid", stats.realKissesPaid],
  ] as const;

  const tricks = [
    {
      title: "Variable rewards",
      text: `Each play has a ${percent(odds.common)} chance of a common coupon, ${percent(odds.rare)} rare, ${percent(odds.epic)} epic and ${percent(odds.jackpot)} jackpot. Small kiss wins are frequent so the big ones always feel close.`,
    },
    {
      title: "Beginner's luck",
      text: `Your first ${config.beginnersLuck.plays} plays had ${config.beginnersLuck.multiplier}× the odds, with a rare coupon guaranteed. Then the odds quietly went back to normal. ${stats.beginnerCoupons} of your coupons came from this.`,
    },
    {
      title: "Losses disguised as wins",
      text: "Two 💋 on a line pay half your bet — with lights, sound and “WIN!”. You lost kisses each time.",
    },
    {
      title: "Near misses",
      text: `${percent(config.slots.nearMissRate)} of losing spins were drawn with two 7️⃣ and a third one just off the line. Scratch cards did it ${percent(config.scratch.nearMissRate)} of the time with an “almost”. They were never close: the outcome was decided first.`,
    },
    {
      title: "The luck meter",
      text: `It never shows less than ${percent(config.luckMeter.floor)} or more than ${percent(config.luckMeter.ceiling)}. It is a pity timer in disguise: odds really do rise after ${config.pity.rampStart} dry plays, with a coupon guaranteed by play ${config.pity.guaranteeAfter}. ${stats.pityCoupons} coupons came from pity.`,
    },
    {
      title: "Welcome back bonus",
      text: `From ${config.welcomeBack.minBonus} 💋 after a day to ${config.welcomeBack.maxBonus} 💋 after two weeks, plus ${config.welcomeBack.boostMultiplier}× odds for ${config.welcomeBack.boostPlays} plays. Staying away never cost you anything — it just made coming back feel lucky.`,
    },
    {
      title: "Hot streaks, missions and gifted progress",
      text: `Three wins in a row doubled payouts for ${config.hotStreak.plays} plays — on the slots, scratch cards and wheel only, never at the tables. Every progress bar (missions, VIP, sets, the Kiss Pass) started ${percent(config.missions.giftedProgress)} full so everything looked nearly done.`,
    },
    {
      title: "Roulette dei Baci",
      text: `A fair wheel with unfair payouts: red, black, even and odd pay ${config.roulette.payouts.color}× instead of 2×, a single number ${config.roulette.payouts.number}× instead of 36×. The house keeps about ${percent(1 - (18 / 37) * config.roulette.payouts.color)} of every bet. ${config.roulette.jackpotNumber} pays an epic coupon — 1 chance in 37. You spun it ${stats.rouletteSpins} times.`,
    },
    {
      title: "Blackjack dei Baci",
      text: `A real deck, a real dealer standing on ${config.blackjack.dealerStandsOn} — but a blackjack pays ${config.blackjack.naturalPays}×, not 2.5×, and when you both bust you have already lost. ${stats.naturals} of your ${stats.blackjackHands} hands were blackjacks.`,
    },
    {
      title: "The jackpot ticker",
      text: "The number at the top rose with every bet. It was never a pot: it was decoration, and it reset whenever a jackpot coupon dropped.",
    },
    {
      title: "Kiss Pass",
      text: `A free track that paid a few 💋 every ${config.kissPass.playsPerTier} plays. Its real job was to make stopping feel like leaving rewards on the table.`,
    },
    {
      title: "Decoy pricing",
      text: "The Smooch Bundle exists only to make the French Treasury look clever. The first-purchase double and the flash deal countdown exist only to make you buy now.",
    },
    {
      title: "The piggy bank",
      text: `It filled itself with ${percent(config.piggy.share)} of every bet, and cost ${config.piggy.breakCostRealKisses} real kisses to break. The fuller it got, the more it hurt to leave it.`,
    },
    {
      title: "Double or Nothing",
      text: `A ${percent(config.doubleOrNothing.winChance)} chance, not 50%. The “no” button was small on purpose.`,
    },
    {
      title: "Beat Gianmaria",
      text: "Simulated Gianmaria was always exactly one win away. He never actually played.",
    },
    {
      title: "The exit",
      text: "Leaving with kisses left triggered a reminder about your luck meter. The biggest button was always the one that kept you playing.",
    },
  ];

  return (
    <div className="page-container max-w-4xl py-8 sm:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase hover:text-[var(--ink)]"
        href="/coupons/casino"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        Back to the casino (it still works)
      </Link>

      <header className="mt-4 rounded-[2rem] bg-[var(--oxblood)] px-6 py-10 text-[var(--paper-white)] sm:px-10">
        <p className="text-[0.6rem] font-bold tracking-[0.2em] text-white/75 uppercase">
          Classified · House eyes only
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,9vw,5.5rem)] leading-[0.9] tracking-[-0.05em] italic">
          Behind the Curtain
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
          You found it. Here is exactly how the Kiss Casino worked on you —
          every trick, with the real numbers.
        </p>
      </header>

      <section aria-labelledby="your-numbers" className="mt-10">
        <h2 className="font-display text-3xl" id="your-numbers">
          Your numbers
        </h2>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {numbers.map(([label, value]) => (
            <div
              className="rounded-2xl border border-[var(--line-strong)] bg-[var(--paper-white)] p-4"
              key={label}
            >
              <dd className="font-display text-3xl">{value}</dd>
              <dt className="mt-1 text-xs text-[var(--muted)]">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-[var(--muted)]">
          For every 100 💋 you played, the games paid back about{" "}
          {Math.round(returned * 100)}. The slots alone are tuned to return
          about {Math.round(slotRtp * 100)} before hot streaks.
        </p>
      </section>

      <section aria-labelledby="the-tricks" className="mt-12">
        <h2 className="font-display text-3xl" id="the-tricks">
          The tricks
        </h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-2">
          {tricks.map((trick, index) => (
            <li
              className="rounded-2xl bg-[var(--paper-white)] p-5 shadow-[var(--shadow-paper)]"
              key={trick.title}
            >
              <p className="font-mono text-xs text-[var(--rust)]">
                TRICK {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-display text-2xl">{trick.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {trick.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="a-message" className="mt-12">
        <h2 className="sr-only" id="a-message">
          A message from Gianmaria
        </h2>
        <div className="rounded-[1.6rem] border border-[var(--line-strong)] bg-[var(--paper-white)] p-6 sm:p-9">
          {curtainMessage.paragraphs.map((paragraph) => (
            <p
              className="mt-3 font-display text-2xl leading-snug first:mt-0"
              key={paragraph}
            >
              {paragraph}
            </p>
          ))}
          <HandwrittenNote className="mt-4 block text-right" tone="burgundy">
            {curtainMessage.signoff}
          </HandwrittenNote>
        </div>
      </section>

      <section
        aria-labelledby="house-loses"
        className="mt-10 rounded-[1.6rem] bg-[var(--ink)] p-6 text-[var(--paper-white)] sm:p-9"
      >
        <p className="font-mono text-xs tracking-[0.16em] text-white/75">
          FINAL COUPON · IMPOSSIBLE
        </p>
        <h2 className="mt-2 font-display text-4xl" id="house-loses">
          The House Always Loses to You
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
          Claim it and your entire kiss debt is forgiven. The casino stays open,
          rigged as ever, if you fancy another round.
        </p>
        <div className="[&_p]:text-white/90">
          <FinaleClaim claimed={curtain.finaleClaimed} />
        </div>
      </section>
    </div>
  );
}
