"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

/** Run time stops during pause; callbacks read the latest game state. */
export function useGameCountdown(
  initialSeconds: number,
  enabled: boolean,
  onExpire: () => void,
) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const remainingRef = useRef(initialSeconds);
  const tick = useEffectEvent(() => {
    if (remainingRef.current <= 0) return;
    remainingRef.current -= 1;
    setSecondsLeft(remainingRef.current);
    if (remainingRef.current === 0) onExpire();
  });

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, [enabled]);

  const resetCountdown = useCallback((seconds: number) => {
    remainingRef.current = seconds;
    setSecondsLeft(seconds);
  }, []);

  return { secondsLeft, resetCountdown };
}

/** Feedback transitions stop on pause and are cancelled on route cleanup. */
export function useGameDelay(
  enabled: boolean,
  delayMs: number,
  onElapsed: () => void,
) {
  const elapsed = useEffectEvent(onElapsed);
  useEffect(() => {
    if (!enabled) return;
    const timeout = window.setTimeout(elapsed, delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, enabled]);
}
