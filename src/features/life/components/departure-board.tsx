"use client";

import { useEffect, useRef, useState } from "react";

import { RollingGroup, RollingNumber } from "@/components/ui/rolling-number";

import { boardingLine, countdownTo, type Countdown } from "../lib/countdown";
import type { NextTime } from "../lib/schemas";
import styles from "./next-time.module.css";

function words(text: string) {
  const out: { word: string; start: number }[] = [];
  for (const match of text.matchAll(/\S+/g))
    out.push({ word: match[0], start: match.index });
  return out;
}

function Flaps({ text, label }: { text: string; label: string }) {
  // Previous text kept in state (React's "store info from previous render").
  const [shown, setShown] = useState({ current: text, previous: text });
  if (shown.current !== text)
    setShown({ current: text, previous: shown.current });
  const previous = shown.previous;
  return (
    <span aria-label={label} className={styles.flaps} role="text">
      {/* One group per word, so a line only breaks between words. */}
      {words(text.toUpperCase()).map(({ word, start }) => (
        <span className={styles.word} key={start}>
          {[...word].map((char, offset) => {
            const index = start + offset;
            return (
              <span
                aria-hidden="true"
                className={`${styles.flap} ${previous[index] !== text[index] ? styles.flip : ""}`}
                key={`${index}-${char}`}
                style={{ ["--delay" as string]: `${index * 18}ms` }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

const two = { minimumIntegerDigits: 2 } as const;

/** "12 days 04:32:10", every digit rolling (NumberFlow), read as one line. */
function RollingCountdown({ countdown }: { countdown: Countdown }) {
  return (
    <span
      aria-atomic="true"
      aria-label={boardingLine(countdown)}
      className="block font-mono text-2xl font-bold tracking-[0.04em] text-[#f2c84b] tabular-nums sm:text-3xl"
      role="timer"
    >
      <RollingGroup>
        <RollingNumber
          suffix={countdown.days === 1 ? " DAY " : " DAYS "}
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

const statusText = {
  "on-time": "ON TIME",
  delayed: "DELAYED (TOO MUCH HUGGING)",
  boarding: "NOW BOARDING",
} as const;

/** The airport departures board: from, to, a live countdown, the status. */
export function DepartureBoard({ next }: { next: NextTime }) {
  const [now, setNow] = useState<number | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const countdown = now === null ? null : countdownTo(next.at, now);
  const landed = Boolean(countdown?.landed);
  const almost = Boolean(countdown?.almost);

  useEffect(() => {
    if (!landed || celebrated.current) return;
    celebrated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  const line = !next.at
    ? "DATE TO BE ANNOUNCED"
    : countdown
      ? boardingLine(countdown)
      : "…";

  return (
    <section
      aria-label="Departures"
      className={`${styles.board} ${almost || landed ? styles.festive : ""}`}
    >
      {almost || landed ? (
        <p aria-hidden="true" className={styles.garland}>
          🎉✈️❤️✈️🎉
        </p>
      ) : null}
      <div className={styles.boardHead}>
        <span>Departures</span>
        <span>Flight VG-031</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>From → To</span>
        <Flaps
          label={`From ${next.from} to ${next.to}`}
          text={`${next.from} > ${next.to}`}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>
          {landed ? "Arrived" : "Boarding in"}
        </span>
        {countdown && !landed ? (
          <RollingCountdown countdown={countdown} />
        ) : (
          <Flaps label={line} text={line} />
        )}
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Status</span>
        <span
          className={`${styles.status} font-mono text-lg font-bold tracking-[0.12em]`}
          data-status={landed ? "boarding" : next.status}
        >
          {landed
            ? "LANDED ❤️"
            : almost
              ? "ALMOST THERE ✨"
              : statusText[next.status]}
        </span>
      </div>
    </section>
  );
}
