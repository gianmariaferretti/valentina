"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { cn } from "@/lib/cn";

import { spinKissRoulette, type CasinoActionResult } from "../actions";
import {
  pocketColor,
  type RouletteBet,
  type RouletteEvent,
} from "../lib/engine";
import styles from "./casino.module.css";
import { pickQuip } from "./croupier";
import { connectionLost, type GameProps } from "./game-types";

const cfg = casinoConfig.roulette;
const order = cfg.order;
const POCKET = 360 / order.length;
const fills = { red: "#b5172f", black: "#1d1d1d", green: "#0b7a43" } as const;

function betLabel(bet: RouletteBet) {
  if (bet.kind === "number") return `number ${bet.value}`;
  return bet.value;
}

function arc(index: number, outer: number, inner: number) {
  const a0 = ((index * POCKET - POCKET / 2 - 90) * Math.PI) / 180;
  const a1 = ((index * POCKET + POCKET / 2 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${r * Math.cos(a)} ${r * Math.sin(a)}`;
  return `M ${p(outer, a0)} A ${outer} ${outer} 0 0 1 ${p(outer, a1)} L ${p(inner, a1)} A ${inner} ${inner} 0 0 0 ${p(inner, a0)} Z`;
}

/** Static wheel artwork; only its rotation changes. */
function WheelArt() {
  return (
    <>
      <circle fill="#4a2a1a" r="100" />
      <circle fill="#2a170e" r="90" />
      {order.map((pocket, index) => {
        const mid = ((index * POCKET - 90) * Math.PI) / 180;
        return (
          <g key={pocket}>
            <path
              d={arc(index, 88, 64)}
              fill={fills[pocketColor(pocket)]}
              stroke="#c79a3b"
              strokeWidth="0.6"
            />
            <text
              fill={pocket === cfg.jackpotNumber ? "#ffd166" : "#fff"}
              fontSize="6.2"
              fontWeight="900"
              textAnchor="middle"
              transform={`translate(${80 * Math.cos(mid)} ${80 * Math.sin(mid)}) rotate(${index * POCKET})`}
              y="2.2"
            >
              {pocket}
            </text>
          </g>
        );
      })}
      <circle fill="#5b3a22" r="64" />
      <circle fill="none" r="52" stroke="#c79a3b" strokeWidth="1.2" />
      <circle fill="#7a4a2a" r="40" />
      {[0, 1, 2, 3].map((spoke) => (
        <rect
          fill="#ffd166"
          height="60"
          key={spoke}
          rx="2"
          transform={`rotate(${spoke * 45})`}
          width="4"
          x="-2"
          y="-30"
        />
      ))}
      <circle fill="#ffd166" r="9" stroke="#5a3a00" strokeWidth="2" />
    </>
  );
}

export function KissRoulette({
  view,
  turbo,
  busy,
  sound,
  spend,
  onResult,
  setQuip,
}: GameProps) {
  const reduced = useReducedMotion() ?? false;
  const [bet, setBet] = useState<number>(cfg.bets[0]);
  const [placed, setPlaced] = useState<RouletteBet>({
    kind: "color",
    value: "red",
  });
  const [spinning, setSpinning] = useState(false);
  const [event, setEvent] = useState<RouletteEvent | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const angles = useRef({ wheel: 0, ball: 0 });
  const counter = useRef(0);
  const button = useRef<HTMLButtonElement>(null);

  // Park the ball in a pocket before the first spin.
  useEffect(() => {
    const ball = ballRef.current;
    const stage = stageRef.current;
    if (!ball || !stage) return;
    const place = () => {
      ball.style.transform = `translateY(${-0.75 * (stage.getBoundingClientRect().width / 2)}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /**
   * Wheel turns clockwise and slows; the ball runs the other way on the outer
   * track, loses speed, drops with a couple of bounces and settles in its
   * pocket, then rides along with the wheel.
   */
  function animate(pocket: number, duration: number) {
    return new Promise<void>((resolve) => {
      const wheel = wheelRef.current;
      const orbit = orbitRef.current;
      const ball = ballRef.current;
      const stage = stageRef.current;
      if (!wheel || !orbit || !ball || !stage) return resolve();
      const half = stage.getBoundingClientRect().width / 2;
      const pocketAngle =
        order.indexOf(pocket as (typeof order)[number]) * POCKET;
      const w0 = angles.current.wheel;
      const w1 = w0 + (duration ? 360 * 2 + 140 : 0);
      const rel0 = angles.current.ball - w0;
      // Ball relative to the wheel: several turns backwards, ending on the pocket.
      let rel1 = pocketAngle;
      const turns = duration ? 5 : 0;
      while (rel1 > rel0 - turns * 360) rel1 -= 360;
      const place = (wheelAngle: number, relAngle: number, radius: number) => {
        wheel.style.transform = `rotate(${wheelAngle}deg)`;
        orbit.style.transform = `rotate(${wheelAngle + relAngle}deg)`;
        ball.style.transform = `translateY(${-radius * half}px)`;
      };
      if (!duration) {
        place(w1, rel1, 0.75);
        angles.current = { wheel: w1, ball: w1 + rel1 };
        return resolve();
      }
      const started = performance.now();
      let lastPocket = 0;
      const frame = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        const wheelAngle = w0 + (w1 - w0) * (1 - (1 - t) ** 3);
        const tb = Math.min(1, t / 0.86);
        const relAngle = rel0 + (rel1 - rel0) * (1 - (1 - tb) ** 3);
        // Outer track, then a drop with two decaying bounces.
        let radius = 0.92;
        if (t > 0.55) {
          const d = Math.min(1, (t - 0.55) / 0.3);
          const settle = 0.92 - 0.17 * d;
          radius =
            settle + 0.05 * Math.abs(Math.sin(d * Math.PI * 3)) * (1 - d);
        }
        place(wheelAngle, relAngle, radius);
        const passing = Math.floor(relAngle / POCKET);
        if (t > 0.55 && t < 0.86 && passing !== lastPocket) {
          lastPocket = passing;
          sound.play("tick");
        }
        if (t < 1) requestAnimationFrame(frame);
        else {
          angles.current = { wheel: w1, ball: w1 + rel1 };
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  async function spin() {
    if (spinning || busy || view.balance < bet) return;
    setSpinning(true);
    setEvent(null);
    // On a phone the wheel may be scrolled under the HUD: bring it into view.
    if ((stageRef.current?.getBoundingClientRect().top ?? 999) < 160)
      stageRef.current?.scrollIntoView({
        block: "start",
        behavior: reduced ? "instant" : "smooth",
      });
    spend(bet);
    sound.play("roll");
    let result: CasinoActionResult;
    try {
      result = await spinKissRoulette(bet, placed);
    } catch {
      result = connectionLost;
    }
    if (!result.ok || result.event.kind !== "roulette") {
      setSpinning(false);
      await onResult(result, null);
      return;
    }
    const spun = result.event;
    await animate(spun.pocket, reduced ? 0 : turbo ? 1500 : cfg.spinMs);
    sound.stop("roll");
    sound.play("stop");
    counter.current += 1;
    setSpinning(false);
    setEvent(spun);
    setQuip(
      pickQuip(
        spun.coupons.length ? "coupon" : spun.won ? "win" : "lose",
        counter.current,
      ),
    );
    if (!spun.won) sound.play("lose");
    await onResult(result, stageRef.current);
    button.current?.focus({ preventScroll: true });
  }

  const isPlaced = (candidate: RouletteBet) =>
    candidate.kind === placed.kind && candidate.value === placed.value;
  const outside: { bet: RouletteBet; label: string; color?: string }[] = [
    { bet: { kind: "color", value: "red" }, label: "Red", color: "red" },
    { bet: { kind: "color", value: "black" }, label: "Black", color: "black" },
    { bet: { kind: "parity", value: "even" }, label: "Even" },
    { bet: { kind: "parity", value: "odd" }, label: "Odd" },
  ];

  return (
    <div>
      <div className={styles.rouletteStage} ref={stageRef}>
        <svg
          aria-hidden="true"
          className={styles.rouletteWheel}
          ref={wheelRef}
          viewBox="-100 -100 200 200"
        >
          <WheelArt />
        </svg>
        <div aria-hidden="true" className={styles.ballOrbit} ref={orbitRef}>
          <span className={styles.ball} ref={ballRef} />
        </div>
        <span aria-hidden="true" className={styles.rouletteMarker} />
      </div>

      <p
        aria-live="polite"
        className={styles.result}
        data-win={Boolean(event?.won)}
      >
        {event
          ? event.coupons.length > 0
            ? `${event.pocket}! You won: ${event.coupons[0].title}`
            : event.won
              ? `${event.pocket} ${event.color} · WIN! +${event.payout} 💋`
              : `${event.pocket} ${event.color} · No win`
          : spinning
            ? "No more bets…"
            : `Your bet: ${betLabel(placed)}`}
      </p>

      <button
        className={styles.bigButton}
        disabled={spinning || busy || view.balance < bet}
        onClick={() => void spin()}
        ref={button}
        type="button"
      >
        {spinning ? "Spinning…" : `Spin · ${bet} 💋 on ${betLabel(placed)}`}
      </button>

      <div className={styles.controls}>
        <div aria-label="Bet" className="flex gap-2" role="group">
          {cfg.bets.map((value) => (
            <button
              aria-label={`Bet ${value} kisses`}
              aria-pressed={bet === value}
              className={styles.chip}
              disabled={spinning}
              key={value}
              onClick={() => setBet(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div aria-label="Where to bet" className={styles.board} role="group">
        <div className={styles.outsideBets}>
          {outside.map((item) => (
            <button
              aria-pressed={isPlaced(item.bet)}
              className={styles.betButton}
              data-color={item.color}
              disabled={spinning}
              key={item.label}
              onClick={() => setPlaced(item.bet)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.numberGrid}>
          {Array.from({ length: 37 }, (_, n) => (
            <button
              aria-label={
                n === cfg.jackpotNumber
                  ? `Number ${n}, jackpot number`
                  : `Number ${n}`
              }
              aria-pressed={isPlaced({ kind: "number", value: n })}
              className={cn(
                styles.betButton,
                n === cfg.jackpotNumber && styles.jackpotPocket,
              )}
              data-color={pocketColor(n)}
              disabled={spinning}
              key={n}
              onClick={() => setPlaced({ kind: "number", value: n })}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Paytable" className={styles.paytable}>
        <h3>Paytable · bet {bet} 💋</h3>
        <ul>
          <li>
            <span>Red or black</span>
            <span>{Math.floor(bet * cfg.payouts.color)} 💋</span>
          </li>
          <li>
            <span>Even or odd</span>
            <span>{Math.floor(bet * cfg.payouts.parity)} 💋</span>
          </li>
          <li>
            <span>One number</span>
            <span>{Math.floor(bet * cfg.payouts.number)} 💋</span>
          </li>
          <li>
            <span>★ {cfg.jackpotNumber}, the day it all began</span>
            <span>{Math.floor(bet * cfg.payouts.number)} 💋 + epic coupon</span>
          </li>
        </ul>
        <p className="mt-2 text-[0.7rem] text-[#cfe3d6]">
          0 is green: red, black, even and odd all lose.
        </p>
      </section>
    </div>
  );
}
