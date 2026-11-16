"use client";

import {
  ArrowLeft,
  CircleHelp,
  Gift,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { toast } from "sonner";

import { Portal } from "@/components/ui/portal";
import { casinoConfig } from "@/data/casino-config";
import { casinoPrizes } from "@/data/casino-prizes";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { cn } from "@/lib/cn";

import {
  breakPiggyBank,
  buyKissPack,
  collectKissPass,
  collectMission,
  collectWelcomeBonus,
  completeWelcome,
  enterKissCasino,
  type CasinoActionResult,
} from "../actions";
import type { CasinoView, PlayEvent } from "../lib/engine";
import {
  RewardsDrawer,
  ShopDrawer,
  type DrawerActions,
} from "./casino-drawers";
import { AnimatedNumber } from "./casino-panels";
import styles from "./casino.module.css";
import { Croupier, pickQuip } from "./croupier";
import { DoubleOrNothing } from "./double-or-nothing";
import { CasinoEffects, useCasinoEffects } from "./effects";
import { FortuneWheel } from "./fortune-wheel";
import { connectionLost, type GameProps } from "./game-types";
import { KissBlackjack } from "./kiss-blackjack";
import { KissRoulette } from "./kiss-roulette";
import { LoveSlots } from "./love-slots";
import { ScratchCards } from "./scratch-cards";
import { useCasinoSound, type CasinoSoundApi } from "./sounds";
import { ResetCurtains, WelcomeTour } from "./welcome";

type GameId = "slots" | "roulette" | "blackjack" | "scratch" | "wheel";

const prizeOf = (tier: string) =>
  casinoPrizes.find((prize) => prize.kind === tier)?.title ?? "";

interface TableInfo {
  id: GameId;
  name: string;
  art: string;
  from: number;
  coupons: string;
  top: string;
  Game: ComponentType<GameProps>;
}

const tables: TableInfo[] = [
  {
    id: "slots",
    name: "Love Slots",
    art: "🎰",
    from: casinoConfig.slots.bets[0],
    coupons: "🍦 💆 🌹 7️⃣",
    top: `7️⃣7️⃣7️⃣ JACKPOT · 💋×5 = ${casinoConfig.slots.outcomes[0].multiplier}× bet`,
    Game: LoveSlots,
  },
  {
    id: "roulette",
    name: "Roulette dei Baci",
    art: "🎡",
    from: casinoConfig.roulette.bets[0],
    coupons: "🌹",
    top: `★ ${casinoConfig.roulette.jackpotNumber} = epic coupon (${prizeOf("epic")}…)`,
    Game: KissRoulette,
  },
  {
    id: "blackjack",
    name: "Blackjack dei Baci",
    art: "🃏",
    from: casinoConfig.blackjack.bets[0],
    coupons: "💆",
    top: "Blackjack = rare coupon",
    Game: KissBlackjack,
  },
  {
    id: "scratch",
    name: "Scratch Cards",
    art: "🎟️",
    from: casinoConfig.scratch.tiers.bronze.cost,
    coupons: "🍦 💆 🌹",
    top: `7️⃣7️⃣7️⃣ = ${casinoConfig.scratch.tiers.gold.outcomes[0].multiplier}× the ticket`,
    Game: ScratchCards,
  },
  {
    id: "wheel",
    name: "Wheel of Fortune",
    art: "🎯",
    from: casinoConfig.wheel.cost,
    coupons: "🎟️",
    top: "200 💋 or a coupon",
    Game: FortuneWheel,
  },
];

const chipSpots = [
  { left: "3%", top: "38%", rotate: -18 },
  { left: "92%", top: "30%", rotate: 22 },
  { left: "6%", top: "86%", rotate: 8 },
  { left: "90%", top: "78%", rotate: -12 },
  { left: "48%", top: "97%", rotate: 30 },
];

function playOf(result: CasinoActionResult): PlayEvent | null {
  if (!result.ok) return null;
  const event = result.event;
  if (
    event.kind === "slots" ||
    event.kind === "roulette" ||
    event.kind === "scratch" ||
    event.kind === "wheel"
  )
    return event;
  if (event.kind === "blackjack") return event.play;
  return null;
}

export function KissCasino({ initialView }: { initialView: CasinoView }) {
  const sound = useCasinoSound();
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <CasinoEffects rootRef={rootRef} sound={sound}>
      <CasinoFloor initialView={initialView} rootRef={rootRef} sound={sound} />
    </CasinoEffects>
  );
}

function CasinoFloor({
  initialView,
  sound,
  rootRef,
}: {
  initialView: CasinoView;
  sound: CasinoSoundApi;
  rootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const effects = useCasinoEffects();
  const [view, setView] = useState(initialView);
  const [screen, setScreen] = useState<GameId | null>(null);
  const [busy, setBusy] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [doubleAmount, setDoubleAmount] = useState<number | null>(null);
  const [quip, setQuip] = useState<string>(
    pickQuip("lobby", initialView.season),
  );
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [curtains, setCurtains] = useState(
    initialView.season > 1 && !initialView.onboarded,
  );
  const [tour, setTour] = useState(
    initialView.season === 1 && !initialView.onboarded,
  );
  const [leaving, setLeaving] = useState(false);
  const pushed = useRef(false);
  const quipSeed = useRef(initialView.season);
  const stayRef = useRef<HTMLButtonElement>(null);
  const closeLeave = useCallback(() => setLeaving(false), []);
  const { balanceRef, walletRef } = effects;
  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: stayRef,
    isOpen: leaving,
    onClose: closeLeave,
    returnFocusRef: walletRef,
  });

  // Fresh visit bookkeeping (welcome bonus, missions, flash deal).
  useEffect(() => {
    enterKissCasino()
      .then((result) => {
        if (result.ok) setView(result.view);
      })
      .catch(() => undefined);
  }, []);

  // ← Lobby and the phone's back gesture both return to the lobby.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const game = (event.state as { casinoGame?: GameId } | null)?.casinoGame;
      pushed.current = Boolean(game);
      setScreen(game ?? null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openGame = (id: GameId) => {
    window.history.pushState({ ...window.history.state, casinoGame: id }, "");
    pushed.current = true;
    setScreen(id);
    quipSeed.current += 1;
    setQuip(pickQuip("lobby", quipSeed.current));
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const backToLobby = () => {
    if (pushed.current) window.history.back();
    else setScreen(null);
  };

  const refresh = useCallback(() => {
    enterKissCasino()
      .then((fresh) => fresh.ok && setView(fresh.view))
      .catch(() => undefined);
  }, []);

  const spend = useCallback((amount: number) => {
    setView((current) => ({
      ...current,
      balance: Math.max(0, current.balance - amount),
    }));
  }, []);

  /** Plays out a result: coins, the counter, celebrations, coupons. */
  const onResult = useCallback(
    async (result: CasinoActionResult, origin: Element | null) => {
      if (!result.ok) {
        toast(result.message, { icon: "🎲" });
        if (result.view) setView(result.view);
        else refresh();
        return;
      }
      const event = result.event;
      const play = playOf(result);
      if (play) {
        setCelebrating(true);
        if (play.payout > 0) {
          // Everything but the balance first; the balance counts up as the
          // coins land.
          setView((current) => ({ ...result.view, balance: current.balance }));
          if (play.payout >= play.bet) sound.play("win");
          await effects.flyCoins(origin, play.payout);
        }
        setView(result.view);
        await effects.celebrate(play.winLevel, play.payout);
        if (play.coupons.length) await effects.revealCoupons(play.coupons);
        if (play.hotStreakStarted)
          toast("HOT STREAK 🔥", {
            description: `×${casinoConfig.hotStreak.multiplier} payouts for the next ${casinoConfig.hotStreak.plays} plays.`,
          });
        if (play.levelUp)
          toast(`VIP ${play.levelUp.label}!`, {
            description: `+${play.levelUp.bonus} 💋 and a new slot theme.`,
            icon: "👑",
          });
        if (play.beat?.status === "won")
          toast("You beat Gianmaria!", { icon: "🏆" });
        if (play.curtainUnlocked)
          toast("Something opened behind the curtain…", { icon: "🎭" });
        setCelebrating(false);
        if (result.view.pendingDouble)
          setDoubleAmount(result.view.pendingDouble);
        return;
      }
      if (event.kind === "double") {
        setView((current) => ({ ...result.view, balance: current.balance }));
        if (event.won) {
          sound.play("win");
          await effects.flyCoins(origin, event.amount * 2);
        }
        setView(result.view);
        return;
      }
      setView(result.view);
      if (event.kind === "claim") {
        sound.play("coin");
        effects.bumpBalance();
        toast(`+${event.chips} 💋`, { description: event.label, icon: "🎁" });
      } else if (event.kind === "purchase") {
        sound.play("coin");
        effects.bumpBalance();
        toast(`+${event.chips} 💋${event.doubled ? " (doubled!)" : ""}`, {
          description: `${event.realKisses} real kisses added to your Kiss Debt.`,
          icon: "💋",
        });
      } else if (event.kind === "piggy") {
        sound.play("coin");
        effects.bumpBalance();
        toast(`Oink. +${event.chips} 💋`, {
          description: `${event.realKisses} real kisses owed.`,
          icon: "🐷",
        });
      }
    },
    [effects, refresh, sound],
  );

  const runAction = useCallback(
    async (action: () => Promise<CasinoActionResult>) => {
      if (busy) return;
      setBusy(true);
      let result: CasinoActionResult;
      try {
        result = await action();
      } catch {
        result = connectionLost;
      }
      await onResult(result, balanceRef.current);
      setBusy(false);
    },
    [busy, balanceRef, onResult],
  );

  const drawerActions: DrawerActions = {
    busy,
    onWelcome: () => void runAction(collectWelcomeBonus),
    onMission: (id) => void runAction(() => collectMission(id)),
    onPass: () => void runAction(collectKissPass),
    onPiggy: () => void runAction(breakPiggyBank),
    onBuy: (id) => void runAction(() => buyKissPack(id)),
  };

  const finishTour = () => {
    setTour(false);
    if (!view.onboarded) {
      setView((current) => ({ ...current, onboarded: true }));
      completeWelcome().catch(() => undefined);
    }
  };

  const table = tables.find((item) => item.id === screen) ?? null;
  const luckPercent = Math.round(view.luckMeter * 100);
  const doubling = doubleAmount !== null;
  const gameProps: GameProps = {
    view,
    turbo,
    // Nothing new starts until the last result has fully played out.
    busy: busy || doubling || celebrating,
    paused: celebrating || doubling || rewardsOpen || shopOpen,
    sound,
    spend,
    onResult,
    setQuip,
  };

  return (
    <div className={styles.floor} ref={rootRef}>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <Link
          className="inline-flex min-h-11 items-center gap-1.5 text-[#d6e9dc] underline-offset-4 hover:underline"
          href="/coupons"
          onClick={(event) => {
            if (view.balance > 0) {
              event.preventDefault();
              setLeaving(true);
            }
          }}
          ref={walletRef as React.RefObject<HTMLAnchorElement | null>}
        >
          <ArrowLeft aria-hidden="true" size={13} />
          Wallet
        </Link>
        <button
          className={styles.rewardsButton}
          onClick={() => setRewardsOpen(true)}
          type="button"
        >
          <Gift aria-hidden="true" size={15} />
          Rewards
          {view.rewardsBadge > 0 ? (
            <span className={styles.badge}>{view.rewardsBadge}</span>
          ) : null}
        </button>
        <button
          className="inline-flex min-h-11 items-center gap-1.5 text-[#ffd166] underline-offset-4 hover:underline"
          onClick={() => setTour(true)}
          type="button"
        >
          <CircleHelp aria-hidden="true" size={14} />
          How it works
        </button>
      </div>

      <header aria-label="Your table" className={styles.hud}>
        <p
          aria-live="polite"
          className={styles.balance}
          ref={balanceRef as React.RefObject<HTMLParagraphElement | null>}
        >
          <span className="sr-only">Balance:</span>
          <AnimatedNumber value={view.balance} />
          <span aria-hidden="true">💋</span>
        </p>
        <div className={styles.luckMini}>
          <span>Luck {luckPercent}%</span>
          <div
            aria-label="Luck meter"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={luckPercent}
            className={styles.meter}
            role="meter"
          >
            <div
              className={styles.meterFill}
              style={{ width: `${luckPercent}%` }}
            />
          </div>
        </div>
        <button
          aria-label={sound.enabled ? "Sound off" : "Sound on"}
          aria-pressed={sound.enabled}
          className={styles.hudButton}
          onClick={sound.toggle}
          type="button"
        >
          {sound.enabled ? (
            <Volume2 aria-hidden="true" size={17} />
          ) : (
            <VolumeX aria-hidden="true" size={17} />
          )}
        </button>
        <button
          className={cn(styles.hudButton, styles.buyButton)}
          onClick={() => setShopOpen(true)}
          type="button"
        >
          Buy 💋
          {view.firstPurchaseDouble ? (
            <span className={styles.badge}>×2</span>
          ) : null}
        </button>
      </header>

      <p className={styles.ticker}>
        <span>Jackpot</span>
        <span className={styles.tickerValue}>
          <AnimatedNumber value={view.jackpotPool} /> 💋
        </span>
      </p>

      {table ? (
        <section
          aria-labelledby="game-title"
          className={cn(styles.gameFrame, view.hot.active && styles.fire)}
        >
          <div className={styles.gameHeader}>
            <button
              className={styles.lobbyLink}
              onClick={backToLobby}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Lobby
            </button>
            <h2 className={styles.gameTitle} id="game-title">
              {table.name}
            </h2>
            <button
              aria-label="Turbo"
              aria-pressed={turbo}
              className={styles.hudButton}
              onClick={() => setTurbo((value) => !value)}
              type="button"
            >
              <Zap aria-hidden="true" size={15} />
            </button>
          </div>
          {view.hot.active ? (
            <p
              className={cn(styles.banner, "mb-3")}
              data-tone="hot"
              role="status"
            >
              HOT STREAK 🔥 ×{casinoConfig.hotStreak.multiplier} ·{" "}
              {view.hot.playsLeft} plays left
            </p>
          ) : null}
          <table.Game {...gameProps} />
          <p aria-live="polite" className={styles.quip}>
            <span aria-hidden="true">🎩 </span>
            {quip}
          </p>
          {doubling && doubleAmount ? (
            <DoubleOrNothing
              amount={doubleAmount}
              busy={busy}
              key={doubleAmount}
              onClose={() => setDoubleAmount(null)}
              onResult={onResult}
              sound={sound}
            />
          ) : null}
        </section>
      ) : (
        <section aria-label="Lobby">
          {chipSpots.map((spot, index) => (
            <span
              aria-hidden="true"
              className={styles.chips}
              key={index}
              style={{
                left: spot.left,
                top: spot.top,
                rotate: `${spot.rotate}deg`,
              }}
            >
              💋
            </span>
          ))}
          <div className={styles.sign}>
            <span aria-hidden="true" className={styles.bulbRow} data-edge="top">
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  className={styles.bulb}
                  key={i}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </span>
            <h2 className={styles.signTitle}>Kiss Casino</h2>
            <p className={styles.signSub}>Season {view.season} · open late</p>
            <span
              aria-hidden="true"
              className={styles.bulbRow}
              data-edge="bottom"
            >
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  className={styles.bulb}
                  key={i}
                  style={{ animationDelay: `${(13 - i) * 0.1}s` }}
                />
              ))}
            </span>
          </div>

          <div className={styles.croupierRow}>
            <Croupier />
            <p aria-live="polite" className={styles.bubble}>
              {quip}
            </p>
          </div>

          {view.visit?.welcomeBonus ? (
            <button
              className={cn(styles.banner, "mb-4 w-full")}
              onClick={() => setRewardsOpen(true)}
              type="button"
            >
              <span>Welcome bonus waiting: +{view.visit.welcomeBonus} 💋</span>
              <span className="text-xs underline">Open Rewards</span>
            </button>
          ) : null}

          <div className={styles.tables}>
            {tables.map((item) => {
              const tag =
                item.id === "wheel" && view.freeWheel
                  ? { text: "FREE SPIN READY", tone: "gold" }
                  : item.id === "slots" && view.hot.active
                    ? { text: "HOT 🔥", tone: undefined }
                    : item.id === "roulette"
                      ? { text: "NEW", tone: "gold" }
                      : item.id === "blackjack"
                        ? { text: "NEW", tone: "gold" }
                        : null;
              return (
                <button
                  className={styles.table}
                  key={item.id}
                  onClick={() => openGame(item.id)}
                  type="button"
                >
                  {tag ? (
                    <span className={styles.tag} data-tone={tag.tone}>
                      {tag.text}
                    </span>
                  ) : null}
                  <span aria-hidden="true" className={styles.tableArt}>
                    {item.art}
                  </span>
                  <span className={styles.tableName}>{item.name}</span>
                  <span className={styles.tableMeta}>
                    {item.id === "wheel" && view.freeWheel
                      ? "Free spin now"
                      : `from ${item.from} 💋`}
                  </span>
                  <span className={styles.tableWin}>
                    <span aria-label="Coupons you can win">{item.coupons}</span>
                    <span>· {item.top}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className={styles.lobbyFooter}>
            <span>Every 💋 is a real kiss.</span>
            <Link
              className="underline underline-offset-4"
              href="/coupons/casino/debt"
            >
              Kiss Debt
            </Link>
          </p>
        </section>
      )}

      <RewardsDrawer
        actions={drawerActions}
        onOpenChange={setRewardsOpen}
        open={rewardsOpen}
        view={view}
      />
      <ShopDrawer
        actions={drawerActions}
        onOpenChange={setShopOpen}
        open={shopOpen}
        view={view}
      />

      <WelcomeTour onClose={finishTour} open={tour && !curtains} />
      {curtains ? (
        <ResetCurtains
          onDone={() => {
            setCurtains(false);
            setTour(true);
          }}
        />
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
                Leaving already?
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
                Stay
              </button>
              <Link className={styles.declineLink} href="/coupons">
                Leave
              </Link>
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}
