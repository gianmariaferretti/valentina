"use client";

import type { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";

/** Casino sound effects (howler, MIT). Off by default; the choice is remembered. */
export type CasinoSound =
  | "spin"
  | "stop"
  | "coin"
  | "win"
  | "bigwin"
  | "jackpot"
  | "scratch"
  | "tick"
  | "card"
  | "flip"
  | "lose"
  | "heartbeat"
  | "roll";

const SOUNDS: readonly CasinoSound[] = [
  "spin",
  "stop",
  "coin",
  "win",
  "bigwin",
  "jackpot",
  "scratch",
  "tick",
  "card",
  "flip",
  "lose",
  "heartbeat",
  "roll",
];
const KEY = "vg.casino.sound";

let bank: Partial<Record<CasinoSound, Howl>> | null = null;

async function loadBank() {
  if (bank) return bank;
  // Loaded only once sound is switched on; howler unlocks audio on iOS
  // after the first tap.
  const { Howl } = await import("howler");
  bank = Object.fromEntries(
    SOUNDS.map((name) => [
      name,
      new Howl({
        src: [`/sounds/casino/${name}.wav`],
        volume: name === "spin" || name === "roll" ? 0.35 : 0.6,
        preload: true,
      }),
    ]),
  );
  return bank;
}

export function useCasinoSound() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(KEY) === "on";
    } catch {
      // Storage is optional.
    }
    if (!stored) return;
    const timer = window.setTimeout(() => {
      enabledRef.current = true;
      setEnabled(true);
      void loadBank();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      // Storage is optional.
    }
    if (next) void loadBank().then((sounds) => sounds.coin?.play());
  }, []);

  const play = useCallback((name: CasinoSound) => {
    if (!enabledRef.current) return;
    void loadBank().then((sounds) => sounds[name]?.play());
  }, []);

  const stop = useCallback((name: CasinoSound) => {
    bank?.[name]?.stop();
  }, []);

  return { enabled, toggle, play, stop };
}

export type CasinoSoundApi = ReturnType<typeof useCasinoSound>;
