"use client";

import { ArrowLeft, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { ScratchTier } from "@/data/casino-config";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { cn } from "@/lib/cn";

import {
  breakPiggyBank,
  buyKissPack,
  collectMission,
  collectWelcomeBonus,
  doubleIt,
  enterKissCasino,
  keepWinnings,
  scratchTicket,
  spinFortuneWheel,
  spinLoveSlots,
  type CasinoActionResult,
} from "../actions";
import type { CasinoView, CouponWin } from "../lib/engine";
import {
  AnimatedNumber,
  BeatPanel,
  FeedPanel,
  LuckPanel,
  MissionsPanel,
  PiggyPanel,
  SetsPanel,
  ShopPanel,
  VipPanel,
} from "./casino-panels";
import styles from "./casino.module.css";
import { FortuneWheel } from "./fortune-wheel";
import { LoveSlots } from "./love-slots";
import { ScratchCards } from "./scratch-cards";

type Game = "slots" | "scratch" | "wheel";

const games: { id: Game; label: string }[] = [
  { id: "slots", label: "Love Slots" },
  { id: "scratch", label: "Scratch" },
  { id: "wheel", label: "Wheel" },
];

interface Celebration {
  bigWin: number | null;
  coupons: CouponWin[];
  levelUp: { label: string; bonus: number } | null;
  hotStreak: boolean;
  curtain: boolean;
}

export function KissCasino({ initialView }: { initialView: CasinoView }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [game, setGame] = useState<Game>("slots");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [, startTransition] = useTransition();
  const play = useGameSound(sound);
  const leaveRef = useRef<HTMLAnchorElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const closeLeave = useCallback(() => setLeaving(false), []);
  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: stayRef,
    isOpen: leaving,
    onClose: closeLeave,
    returnFocusRef: leaveRef,
  });

  useEffect(() => {
    enterKissCasino()
      .then((result) => {
        if (result.ok) setView(result.view);
        else setNotice(result.message);
      })
      .catch(() => setNotice("The casino could not be reached. Try again."));
  }, []);

  /** Applies a settled result: balance, celebrations, sounds. */
  const settle = useCallback(
    (result: CasinoActionResult) => {
      if (!result.ok) {
        setNotice(result.message);
        if (result.view) setView(result.view);
        else
          // Undo the optimistic bet with the real, saved balance.
          enterKissCasino()
            .then((fresh) => fresh.ok && setView(fresh.view))
            .catch(() => undefined);
        return;
      }
      setNotice(null);
      setView(result.view);
      const event = result.event;
      if (
        event.kind === "slots" ||
        event.kind === "scratch" ||
        event.kind === "wheel"
      ) {
        if (event.bigWin && event.payout > 0) play("victory");
        else if (event.celebrated) play("correct");
        if (
          (event.bigWin && event.payout > 0) ||
          event.coupons.length > 0 ||
          event.levelUp ||
          event.hotStreakStarted ||
          event.curtainUnlocked
        ) {
          if (event.bigWin && event.payout > 0) {
            try {
              navigator.vibrate?.([40, 60, 40, 60, 120]);
            } catch {
              // Optional.
            }
          }
          setCelebration({
            bigWin: event.bigWin && event.payout > 0 ? event.payout : null,
            coupons: event.coupons,
            levelUp: event.levelUp,
            hotStreak: event.hotStreakStarted,
            curtain: event.curtainUnlocked,
          });
        }
      } else if (event.kind === "double") {
        play(event.won ? "victory" : "wrong");
        setNotice(
          event.won
            ? `DOUBLED! +${event.amount} 💋`
            : `Gone. ${event.amount} 💋 returned to the house.`,
        );
      } else if (event.kind === "claim") {
        play("collect");
        setNotice(`+${event.chips} 💋 · ${event.label}`);
      } else if (event.kind === "purchase") {
        play("collect");
        setNotice(
          `+${event.chips} 💋${event.doubled ? " (doubled!)" : ""}. ${event.realKisses} real kisses added to your Kiss Debt.`,
        );
      } else if (event.kind === "piggy") {
        play("collect");
        setNotice(
          `Oink. +${event.chips} 💋. ${event.realKisses} real kisses owed.`,
        );
      }
    },
    [play],
  );

  /** Runs a non-animated action (claims, shop) end to end. */
  const act = useCallback(
    (action: () => Promise<CasinoActionResult>) => {
      setBusy(true);
      startTransition(async () => {
        try {
          settle(await action());
        } catch {
          setNotice("The connection dropped. Nothing was charged — try again.");
        } finally {
          setBusy(false);
        }
      });
    },
    [settle],
  );

  const spend = useCallback((amount: number) => {
    setView((current) => ({
      ...current,
      balance: Math.max(0, current.balance - amount),
      pendingDouble: null,
    }));
  }, []);

  const welcome = view.visit?.welcomeBonus ?? 0;
  const pendingDouble = view.pendingDouble;
  const luckPercent = Math.round(view.luckMeter * 100);

  return (
    <div className={styles.floor}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex min-h-11 items-center gap-1.5 text-xs text-[#b9a3ac] underline-offset-4 hover:underline"
          href="/coupons"
          onClick={(event) => {
            if (view.balance > 0) {
              event.preventDefault();
              setLeaving(true);
            }
          }}
          ref={leaveRef}
        >
          <ArrowLeft aria-hidden="true" size={13} />
          Leave
        </Link>
        <p aria-live="polite" className={styles.balance}>
          <span className="sr-only">Balance:</span>
          <AnimatedNumber value={view.balance} />
          <span aria-hidden="true">💋</span>
        </p>
        <div className="flex gap-2">
          <button
            aria-label={sound ? "Turn sound off" : "Turn sound on"}
            aria-pressed={sound}
            className={styles.smallButton}
            onClick={() => setSound((value) => !value)}
            type="button"
          >
            {sound ? (
              <Volume2 aria-hidden="true" size={16} />
            ) : (
              <VolumeX aria-hidden="true" size={16} />
            )}
          </button>
          <button
            aria-pressed={turbo}
            className={styles.smallButton}
            onClick={() => setTurbo((value) => !value)}
            type="button"
          >
            <Zap aria-hidden="true" size={14} />
            Turbo
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {welcome > 0 ? (
          <div className={styles.banner}>
            <span>
              {view.visit?.daysAway
                ? `Welcome back! Your luck is hot 🔥 +${welcome} 💋`
                : `Welcome bonus: +${welcome} 💋`}
            </span>
            <button
              className={cn(styles.smallButton, "bg-black/80")}
              disabled={busy}
              onClick={() => act(collectWelcomeBonus)}
              type="button"
            >
              Collect
            </button>
          </div>
        ) : null}
        {view.visit?.luckBoost && welcome === 0 ? (
          <p className={styles.banner} data-tone="hot">
            Welcome back! Your luck is hot 🔥 for the next few plays.
          </p>
        ) : null}
        {view.hot.active ? (
          <p className={styles.banner} data-tone="hot" role="status">
            HOT STREAK · ×2 payouts for {view.hot.playsLeft} more plays
          </p>
        ) : null}
        {view.firstPurchaseDouble ? (
          <a className={styles.banner} data-tone="gold" href="#kiss-shop">
            <span>Your first Kiss Shop purchase is DOUBLED.</span>
            <span className="text-xs underline">See packs</span>
          </a>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-black/40 px-4 py-3 text-sm" role="status">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-label="Games" className={styles.panel}>
          <div aria-label="Choose a game" className="flex gap-2" role="tablist">
            {games.map((item) => (
              <button
                aria-controls={`game-${item.id}`}
                aria-selected={game === item.id}
                className={cn(styles.chip, "flex-1")}
                id={`tab-${item.id}`}
                key={item.id}
                onClick={() => setGame(item.id)}
                role="tab"
                type="button"
              >
                {item.label}
                {item.id === "wheel" && view.freeWheel ? " · free" : ""}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`tab-${game}`}
            className="mt-4"
            id={`game-${game}`}
            role="tabpanel"
          >
            {game === "slots" ? (
              <LoveSlots
                balance={view.balance}
                disabled={busy}
                onSettled={settle}
                onSpin={(bet) => {
                  spend(bet);
                  return spinLoveSlots(bet);
                }}
                onTick={() => play("move")}
                paused={pendingDouble !== null || celebration !== null}
                theme={view.vip.id === "bronze" ? "classic" : view.vip.id}
                turbo={turbo}
              />
            ) : game === "scratch" ? (
              <ScratchCards
                balance={view.balance}
                disabled={busy}
                onBuy={(tier: ScratchTier) => scratchTicket(tier)}
                onSettled={settle}
              />
            ) : (
              <FortuneWheel
                balance={view.balance}
                disabled={busy}
                free={view.freeWheel}
                onSettled={settle}
                onSpin={spinFortuneWheel}
                turbo={turbo}
              />
            )}
          </div>

          {pendingDouble && celebration === null ? (
            <div className="mt-5 rounded-2xl bg-black/35 p-4 text-center">
              <p className="text-sm">
                You won {pendingDouble} 💋. Feeling brave?
              </p>
              <button
                className={cn(styles.bigButton, "mt-3")}
                disabled={busy}
                onClick={() => act(doubleIt)}
                ref={(element) => element?.focus({ preventScroll: true })}
                type="button"
              >
                Double it? → {pendingDouble * 2} 💋
              </button>
              <button
                className={styles.declineLink}
                disabled={busy}
                onClick={() => act(keepWinnings)}
                type="button"
              >
                No thanks, I&apos;m boring
              </button>
            </div>
          ) : null}
        </section>

        <div className="grid content-start gap-4">
          <LuckPanel view={view} />
          <BeatPanel view={view} />
          <MissionsPanel
            disabled={busy}
            onClaim={(id) => act(() => collectMission(id))}
            view={view}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShopPanel
          disabled={busy}
          onBuy={(id) => act(() => buyKissPack(id))}
          view={view}
        />
        <PiggyPanel
          disabled={busy}
          onBreak={() => act(breakPiggyBank)}
          view={view}
        />
        <VipPanel view={view} />
        <SetsPanel view={view} />
      </div>
      <div className="mt-4">
        <FeedPanel view={view} />
      </div>

      <nav
        aria-label="Casino pages"
        className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#b9a3ac]"
      >
        <Link
          className="underline-offset-4 hover:underline"
          href="/coupons/casino/debt"
        >
          Kiss Debt
        </Link>
        {view.curtainUnlocked ? (
          <Link
            className="inline-flex items-center gap-1 text-[var(--neon-gold,#ffd166)] underline-offset-4 hover:underline"
            href="/coupons/casino/behind-the-curtain"
          >
            <Sparkles aria-hidden="true" size={13} />
            Behind the Curtain
          </Link>
        ) : null}
      </nav>

      {celebration ? (
        <Portal>
          <CelebrationOverlay
            celebration={celebration}
            onClose={() => setCelebration(null)}
            onWallet={() => router.push("/coupons")}
          />
        </Portal>
      ) : null}

      {leaving ? (
        <Portal>
          <div
            aria-labelledby="leave-title"
            aria-modal="true"
            className={styles.overlay}
            onKeyDown={onKeyDown}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className={styles.dialog}>
              <h2
                className="font-display text-3xl leading-tight"
                id="leave-title"
              >
                Are you sure?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Your luck meter is {luckPercent}% full and you still have{" "}
                {view.balance} 💋.
              </p>
              <button
                className={cn(styles.bigButton, "mt-5")}
                onClick={closeLeave}
                ref={stayRef}
                type="button"
              >
                One more spin
              </button>
              <Link
                className={cn(styles.declineLink, "text-[var(--muted)]")}
                href="/coupons"
              >
                Leave anyway
              </Link>
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}

const confettiColors = ["#ff3d9a", "#ffd166", "#8fe9ff", "#fff", "#ff7a59"];

function CelebrationOverlay({
  celebration,
  onClose,
  onWallet,
}: {
  celebration: Celebration;
  onClose: () => void;
  onWallet: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      aria-label="Celebration"
      aria-modal="true"
      className={styles.overlay}
      role="dialog"
    >
      {celebration.bigWin ? (
        <div aria-hidden="true" className={styles.confetti}>
          {Array.from({ length: 42 }, (_, index) => (
            <span
              key={index}
              style={{
                left: `${(index * 37) % 100}%`,
                background: confettiColors[index % confettiColors.length],
                ["--delay" as string]: `${(index % 7) * 0.12}s`,
                ["--fall" as string]: `${2 + (index % 5) * 0.3}s`,
                ["--spin" as string]: `${360 + (index % 4) * 180}deg`,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className={cn(styles.bigWin, "grid max-w-md gap-4")}>
        {celebration.bigWin ? (
          <>
            <p className={styles.bigWinTitle}>BIG WIN</p>
            <p className="font-display text-4xl">+{celebration.bigWin} 💋</p>
          </>
        ) : null}
        {celebration.hotStreak ? (
          <p className="font-display text-3xl text-[#ff7a59]">
            HOT STREAK! ×2 for 5 plays
          </p>
        ) : null}
        {celebration.levelUp ? (
          <p className="font-display text-3xl">
            VIP {celebration.levelUp.label}! +{celebration.levelUp.bonus} 💋 and
            a new theme
          </p>
        ) : null}
        {celebration.coupons.map((coupon) => (
          <div
            className={cn(styles.couponWin, "text-left")}
            key={coupon.couponId}
          >
            <p className="font-mono text-xs tracking-[0.16em]">
              {coupon.code} · {coupon.tier}
            </p>
            <p className="mt-1 font-display text-2xl leading-tight">
              {coupon.title}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {coupon.reason === "set"
                ? "Set complete! Bonus coupon."
                : coupon.reason === "beat"
                  ? "You beat Gianmaria."
                  : "Now in your wallet."}
            </p>
          </div>
        ))}
        {celebration.curtain ? (
          <p className="text-sm text-[#ffd166]">
            Something has opened behind the curtain…
          </p>
        ) : null}
        <div className="grid gap-2">
          <button
            className={styles.bigButton}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            Keep playing
          </button>
          {celebration.coupons.length > 0 ? (
            <button
              className={styles.declineLink}
              onClick={onWallet}
              type="button"
            >
              See it in the wallet
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
