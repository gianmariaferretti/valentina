"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { RollingGroup, RollingNumber } from "@/components/ui/rolling-number";
import {
  afterFirstPaint,
  prefersReducedMotion,
} from "@/lib/effects/capabilities";

import {
  boardingIn,
  boardingInSpoken,
  boardStatus,
  type BoardStatus,
} from "../lib/board";
import { countdownTo, type Countdown } from "../lib/countdown";
import type { NextTime } from "../lib/schemas";
import {
  boardSoundWanted,
  clack,
  rememberBoardSound,
  unlockClack,
} from "./clack";
import styles from "./next-time.module.css";
import { SplitFlap } from "./split-flap";

const FLIGHT = "VG031";
/** Gate 31: the day it started. */
const GATE = "31";

const statusTone: Record<BoardStatus, string> = {
  SCHEDULED: "on-time",
  "ON TIME": "on-time",
  "MISSING YOU": "missing",
  ALMOST: "almost",
  "LANDED ❤": "boarding",
  DELAYED: "delayed",
  "NOW BOARDING": "boarding",
};

const two = { minimumIntegerDigits: 2 } as const;

/** The exact time left, to the second, under the flaps (NumberFlow). */
function RollingCountdown({ countdown }: { countdown: Countdown }) {
  return (
    <span
      aria-hidden="true"
      className="mt-1 block font-mono text-sm font-bold tracking-[0.04em] text-[#8c8f98] tabular-nums"
    >
      <RollingGroup>
        <RollingNumber
          suffix={countdown.days === 1 ? " day " : " days "}
          trend={-1}
          value={countdown.days}
        />
        <RollingNumber
          digits={{ 1: { max: 2 } }}
          format={two}
          suffix=":"
          trend={-1}
          value={countdown.hours}
        />
        <RollingNumber
          digits={{ 1: { max: 5 } }}
          format={two}
          suffix=":"
          trend={-1}
          value={countdown.minutes}
        />
        <RollingNumber
          digits={{ 1: { max: 5 } }}
          format={two}
          trend={-1}
          value={countdown.seconds}
        />
      </RollingGroup>
    </span>
  );
}

function Row({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`${styles.row} ${wide ? styles.wide : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  );
}

/**
 * The airport departures board: flight, from, to, gate, boarding in and a
 * status that jokes as the day gets closer. Split flaps really flip, with a
 * soft clack when sound is on; reduced motion fades instead. Ticking stops
 * while the tab is hidden or the board is off screen.
 */
export function DepartureBoard({ next }: { next: NextTime }) {
  const board = useRef<HTMLElement>(null);
  const [now, setNow] = useState<number | null>(null);
  const [motion, setMotion] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [sound, setSound] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => {
    const host = board.current;
    let visible = false;
    let idle = false;
    let seen = false;
    // Every flap rolls into place the first time the board is on screen,
    // once the page is idle (so it never competes with the first paint).
    const rollIn = () => {
      if (idle && seen) setCycle((c) => (c === 0 ? 1 : c));
    };
    const cancelIdle = afterFirstPaint(() => {
      idle = true;
      rollIn();
    });
    const tick = () => {
      if (visible && !document.hidden) setNow(Date.now());
    };
    const first = window.setTimeout(() => {
      setNow(Date.now());
      setMotion(!prefersReducedMotion());
      setSound(boardSoundWanted());
    }, 0);
    const timer = window.setInterval(tick, 1000);
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          seen = true;
          rollIn();
          tick();
        }
      },
      { threshold: 0.25 },
    );
    if (host) observer.observe(host);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(first);
      cancelIdle();
      window.clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const countdown = now === null ? null : countdownTo(next.at, now);
  const landed = Boolean(countdown?.landed);
  const almost = Boolean(countdown?.almost);

  useEffect(() => {
    if (!landed || celebrated.current) return;
    celebrated.current = true;
    if (prefersReducedMotion()) return;
    void import("canvas-confetti").then(({ default: confetti }) => {
      for (let i = 0; i < 4; i++)
        window.setTimeout(
          () =>
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { x: 0.2 + Math.random() * 0.6, y: 0.4 },
              colors: ["#d6114f", "#f2c84b", "#ffffff", "#9bc8d7"],
              disableForReducedMotion: true,
            }),
          i * 350,
        );
    });
  }, [landed]);

  const onFlip = useCallback(() => {
    if (sound) clack();
  }, [sound]);

  const toggleSound = () => {
    const on = !sound;
    if (on) unlockClack();
    rememberBoardSound(on);
    setSound(on);
  };

  const status = boardStatus(countdown, next.status);
  const flapProps = { cycle, motion, onFlip };
  const pending = next.at && now === null;

  return (
    <section
      aria-label="Departures"
      className={`${styles.board} ${almost || landed ? styles.festive : ""}`}
      ref={board}
    >
      {almost || landed ? (
        <p aria-hidden="true" className={styles.garland}>
          🎉✈️❤️✈️🎉
        </p>
      ) : null}
      <div className={styles.boardHead}>
        <span>Departures</span>
        <button
          aria-label={
            sound ? "Turn the board sound off" : "Turn the board sound on"
          }
          aria-pressed={sound}
          className={styles.sound}
          onClick={toggleSound}
          type="button"
        >
          {sound ? (
            <Volume2 aria-hidden="true" size={16} />
          ) : (
            <VolumeX aria-hidden="true" size={16} />
          )}
        </button>
      </div>

      <div className={styles.cells}>
        <Row label="Flight">
          <SplitFlap text={FLIGHT} lag={0} {...flapProps} />
        </Row>
        <Row label="Gate">
          <SplitFlap text={GATE} lag={220} {...flapProps} />
        </Row>
        <Row label="From" wide>
          <SplitFlap text={next.from} lag={440} {...flapProps} />
        </Row>
        <Row label="To" wide>
          <SplitFlap text={next.to} lag={660} {...flapProps} />
        </Row>
        <Row label={landed ? "Arrived" : "Boarding in"} wide>
          <span
            aria-atomic="true"
            aria-label={boardingInSpoken(countdown)}
            role="timer"
          >
            <SplitFlap
              text={pending ? "--D --H --M" : boardingIn(countdown)}
              lag={880}
              {...flapProps}
            />
          </span>
          {countdown && !landed && countdown.days > 0 ? (
            <RollingCountdown countdown={countdown} />
          ) : null}
        </Row>
        <Row label="Status" wide>
          <span
            className={styles.status}
            data-status={statusTone[status]}
            role="status"
          >
            <SplitFlap text={status} lag={1100} {...flapProps} />
          </span>
        </Row>
      </div>
    </section>
  );
}
