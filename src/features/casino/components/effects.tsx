"use client";

import type confettiType from "canvas-confetti";
import { useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { toast } from "sonner";

import { Portal } from "@/components/ui/portal";
import { getCasinoPrize } from "@/data/casino-prizes";

import type { CouponWin, WinLevel } from "../lib/engine";
import styles from "./casino.module.css";
import { HoloCard } from "./holo-card";
import type { CasinoSoundApi } from "./sounds";

type Confetti = typeof confettiType;

interface EffectsApi {
  balanceRef: RefObject<HTMLElement | null>;
  walletRef: RefObject<HTMLElement | null>;
  /** 💋 coins fly from `from` to the balance; resolves when they land. */
  flyCoins: (from: Element | null, amount: number) => Promise<void>;
  /** Full-screen BIG / MEGA / JACKPOT; resolves when dismissed. */
  celebrate: (level: WinLevel, amount: number) => Promise<void>;
  /** Each won coupon flips out, flashes its rarity and flies to the wallet. */
  revealCoupons: (coupons: readonly CouponWin[]) => Promise<void>;
  shake: () => void;
  bumpBalance: () => void;
}

const EffectsContext = createContext<EffectsApi | null>(null);

export function useCasinoEffects() {
  const context = useContext(EffectsContext);
  if (!context) throw new Error("useCasinoEffects outside CasinoEffects");
  return context;
}

const tierGlow: Record<string, string> = {
  common: "#fffaf2",
  rare: "#ff3d9a",
  epic: "#ffd166",
  jackpot: "#8fe9ff",
  "set-bonus": "#ffd166",
  finale: "#c78bff",
};

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function vibrate(pattern: number[], reduced: boolean) {
  if (reduced) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Optional.
  }
}

export function CasinoEffects({
  children,
  sound,
  rootRef,
}: {
  children: ReactNode;
  sound: CasinoSoundApi;
  rootRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const balanceRef = useRef<HTMLElement | null>(null);
  const walletRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ReturnType<Confetti["create"]> | null>(null);
  const confettiLib = useRef<Confetti | null>(null);
  const [celebration, setCelebration] = useState<{
    level: WinLevel;
    amount: number;
    done: () => void;
  } | null>(null);
  const [prize, setPrize] = useState<{
    coupon: CouponWin;
    phase: "in" | "out";
    /** Offset from the screen centre to the wallet link. */
    to?: { x: number; y: number };
  } | null>(null);

  const getConfetti = useCallback(async () => {
    if (reduced || !canvasRef.current) return null;
    if (!confettiLib.current)
      confettiLib.current = (await import("canvas-confetti")).default;
    confettiRef.current ??= confettiLib.current.create(canvasRef.current, {
      resize: true,
      useWorker: true,
      disableForReducedMotion: true,
    });
    return { fire: confettiRef.current, lib: confettiLib.current };
  }, [reduced]);

  const bumpBalance = useCallback(() => {
    const el = balanceRef.current;
    if (!el || reduced) return;
    el.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)", offset: 0.4 },
        { transform: "scale(1)" },
      ],
      { duration: 380, easing: "ease-out" },
    );
  }, [reduced]);

  const flyCoins = useCallback(
    async (from: Element | null, amount: number) => {
      const target = balanceRef.current;
      if (reduced || !from || !target || amount <= 0) return;
      const a = from.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const count = Math.min(14, 3 + Math.floor(Math.log2(amount + 1) * 2));
      const flights: Promise<unknown>[] = [];
      for (let i = 0; i < count; i++) {
        const coin = document.createElement("span");
        coin.textContent = "💋";
        coin.className = styles.coinFlight;
        document.body.appendChild(coin);
        const sx = a.left + a.width / 2 + (Math.random() - 0.5) * a.width * 0.5;
        const sy =
          a.top + a.height / 2 + (Math.random() - 0.5) * a.height * 0.3;
        const ex = b.left + b.width / 2 - 10;
        const ey = b.top + b.height / 2 - 12;
        const mx = (sx + ex) / 2 + (Math.random() - 0.5) * 120;
        const my = Math.min(sy, ey) - 80 - Math.random() * 60;
        const animation = coin.animate(
          [
            { transform: `translate(${sx}px, ${sy}px) scale(0.6)`, opacity: 0 },
            {
              transform: `translate(${mx}px, ${my}px) scale(1.2)`,
              opacity: 1,
              offset: 0.45,
            },
            {
              transform: `translate(${ex}px, ${ey}px) scale(0.7)`,
              opacity: 0.9,
            },
          ],
          {
            duration: 650 + Math.random() * 250,
            delay: i * 45,
            easing: "cubic-bezier(.3,.7,.4,1)",
          },
        );
        flights.push(
          animation.finished.then(() => {
            coin.remove();
            sound.play("coin");
          }),
        );
      }
      await Promise.all(flights);
      bumpBalance();
    },
    [bumpBalance, reduced, sound],
  );

  const shake = useCallback(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    root.classList.remove(styles.shaking);
    void root.offsetWidth;
    root.classList.add(styles.shaking);
    window.setTimeout(() => root.classList.remove(styles.shaking), 600);
  }, [reduced, rootRef]);

  const celebrate = useCallback(
    (level: WinLevel, amount: number) =>
      new Promise<void>((resolve) => {
        if (level !== "big" && level !== "mega" && level !== "jackpot") {
          resolve();
          return;
        }
        sound.play(level === "jackpot" ? "jackpot" : "bigwin");
        vibrate(
          level === "jackpot" ? [60, 50, 60, 50, 200] : [40, 60, 40],
          reduced,
        );
        shake();
        void getConfetti().then((c) => {
          if (!c) return;
          const kiss = c.lib.shapeFromText({ text: "💋", scalar: 2.2 });
          const bursts = level === "jackpot" ? 7 : level === "mega" ? 4 : 2;
          for (let i = 0; i < bursts; i++)
            window.setTimeout(() => {
              c.fire({
                particleCount: level === "big" ? 70 : 120,
                spread: 80,
                startVelocity: 45,
                origin: {
                  x: 0.2 + Math.random() * 0.6,
                  y: level === "jackpot" ? 0.3 + Math.random() * 0.3 : 0.6,
                },
                colors: ["#ff3d9a", "#ffd166", "#8fe9ff", "#ffffff"],
              });
              c.fire({
                particleCount: 22,
                spread: 120,
                scalar: 2.2,
                shapes: [kiss],
                origin: { y: 0 },
                angle: 270,
                gravity: 1.1,
                startVelocity: 10,
              });
            }, i * 360);
        });
        setCelebration({ level, amount, done: resolve });
      }),
    [getConfetti, reduced, shake, sound],
  );

  const revealCoupons = useCallback(
    async (coupons: readonly CouponWin[]) => {
      for (const coupon of coupons) {
        sound.play(coupon.tier === "jackpot" ? "jackpot" : "win");
        vibrate([30, 40, 30], reduced);
        setPrize({ coupon, phase: "in" });
        await wait(reduced ? 900 : 1700);
        const wallet = walletRef.current?.getBoundingClientRect();
        setPrize({
          coupon,
          phase: "out",
          to: wallet
            ? {
                x: wallet.left + wallet.width / 2 - window.innerWidth / 2,
                y: wallet.top + wallet.height / 2 - window.innerHeight / 2,
              }
            : undefined,
        });
        await wait(reduced ? 250 : 650);
        setPrize(null);
        const setting = getCasinoPrize(coupon.prizeId)?.setting ?? "together";
        toast(`You won: ${coupon.title}`, {
          description: `${coupon.code} · now in your wallet`,
          icon: "🎟️",
          duration: 7000,
          action: {
            label: "See it in your wallet",
            onClick: () =>
              router.push(
                setting === "apart" ? "/coupons?mode=apart" : "/coupons",
              ),
          },
        });
      }
    },
    [reduced, router, sound],
  );

  const api = useMemo(
    () => ({
      balanceRef,
      walletRef,
      flyCoins,
      celebrate,
      revealCoupons,
      shake,
      bumpBalance,
    }),
    [flyCoins, celebrate, revealCoupons, shake, bumpBalance],
  );

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(
      () => {
        celebration.done();
        setCelebration(null);
      },
      celebration.level === "jackpot" ? 3600 : 2600,
    );
    return () => window.clearTimeout(timer);
  }, [celebration]);

  return (
    <EffectsContext.Provider value={api}>
      {children}
      <Portal>
        <canvas
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[96] size-full"
          ref={canvasRef}
        />
        {celebration ? (
          <div
            aria-live="assertive"
            className={styles.overlay}
            onClick={() => {
              celebration.done();
              setCelebration(null);
            }}
            role="status"
          >
            <div
              className={`${styles.celebrationPop} grid justify-items-center gap-3`}
            >
              <p
                className={styles.celebrationTitle}
                data-level={celebration.level}
              >
                {celebration.level === "jackpot"
                  ? "JACKPOT"
                  : celebration.level === "mega"
                    ? "MEGA WIN"
                    : "BIG WIN"}
              </p>
              {celebration.amount > 0 ? (
                <p className="font-display text-4xl">
                  +{celebration.amount} 💋
                </p>
              ) : null}
              <p className="text-xs text-white/70">Tap to continue</p>
            </div>
          </div>
        ) : null}
        {prize ? (
          <div aria-live="assertive" className={styles.overlay} role="status">
            {prize.phase === "in" && !reduced ? (
              <span
                aria-hidden="true"
                className={styles.rarityFlash}
                style={{ ["--flash" as string]: tierGlow[prize.coupon.tier] }}
              />
            ) : null}
            <div
              className="grid justify-items-center gap-3"
              style={
                reduced
                  ? {
                      opacity: prize.phase === "in" ? 1 : 0,
                      transition: "opacity 250ms",
                    }
                  : prize.phase === "in"
                    ? { animation: "none" }
                    : {
                        transition:
                          "transform 620ms cubic-bezier(.5,0,.75,0), opacity 620ms",
                        transform: prize.to
                          ? `translate(${prize.to.x}px, ${prize.to.y}px) scale(0.08) rotate(-20deg)`
                          : "translateY(-60vh) scale(0.1)",
                        opacity: 0.3,
                      }
              }
            >
              <p className="text-xs font-black tracking-[0.2em] text-[#ffd166] uppercase">
                You won
              </p>
              <div className={reduced ? undefined : styles.prizeIn}>
                <HoloCard glow={tierGlow[prize.coupon.tier]}>
                  <div
                    className={styles.prizeCard}
                    data-tier={prize.coupon.tier}
                  >
                    <p className="font-mono text-xs tracking-[0.16em]">
                      {prize.coupon.code}
                    </p>
                    <p className="font-display text-3xl leading-tight">
                      {prize.coupon.title}
                    </p>
                    <p className="text-[0.62rem] font-black tracking-[0.18em] uppercase">
                      {prize.coupon.tier === "set-bonus"
                        ? "set bonus"
                        : prize.coupon.tier}{" "}
                      coupon
                    </p>
                  </div>
                </HoloCard>
              </div>
            </div>
          </div>
        ) : null}
      </Portal>
    </EffectsContext.Provider>
  );
}
