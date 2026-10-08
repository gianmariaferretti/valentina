"use client";

import { useCallback, useEffect, useRef } from "react";

type GameSound = "move" | "collect" | "correct" | "wrong" | "victory";

const soundSettings: Record<
  GameSound,
  { frequency: number; duration: number; type: OscillatorType }
> = {
  move: { frequency: 210, duration: 0.035, type: "sine" },
  collect: { frequency: 520, duration: 0.08, type: "triangle" },
  correct: { frequency: 690, duration: 0.11, type: "sine" },
  wrong: { frequency: 135, duration: 0.14, type: "sawtooth" },
  victory: { frequency: 880, duration: 0.22, type: "triangle" },
};

export function useGameSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    function unlockAudio() {
      try {
        if (!window.AudioContext) return;
        const context =
          contextRef.current ??
          (contextRef.current = new window.AudioContext());
        if (context.state === "suspended")
          void context.resume().catch(() => undefined);
      } catch {
        // Browsers may deny audio; gameplay must continue without sound.
      }
    }
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [enabled]);

  return useCallback(
    (sound: GameSound) => {
      if (!enabled || typeof window === "undefined") return;

      try {
        const AudioContextConstructor = window.AudioContext;
        if (!AudioContextConstructor) return;
        const context =
          contextRef.current ??
          (contextRef.current = new AudioContextConstructor());
        if (context.state !== "running") return;
        const settings = soundSettings[sound];
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime;
        const endAt = startAt + settings.duration;

        oscillator.type = settings.type;
        oscillator.frequency.setValueAtTime(settings.frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.055, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.01);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      } catch {
        // Audio is optional: an unavailable device cannot interrupt a game.
      }
    },
    [enabled],
  );
}
