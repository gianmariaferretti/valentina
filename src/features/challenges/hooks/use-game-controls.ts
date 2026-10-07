"use client";

import { type TouchEventHandler, useCallback, useEffect, useRef } from "react";

import type { GameDirection } from "@/features/challenges/types";

const keyDirections: Record<string, GameDirection | undefined> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
};

export function useGameControls(
  onDirection: (direction: GameDirection) => void,
  enabled: boolean,
) {
  const callbackRef = useRef(onDirection);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    callbackRef.current = onDirection;
  }, [onDirection]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const direction = keyDirections[event.key.toLowerCase()];
      if (!direction) return;

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      callbackRef.current(direction);
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  const onTouchStart = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const touch = event.changedTouches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const origin = touchOriginRef.current;
    const touch = event.changedTouches[0];
    touchOriginRef.current = null;
    if (!origin) return;

    const deltaX = touch.clientX - origin.x;
    const deltaY = touch.clientY - origin.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;

    callbackRef.current(
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
          ? "down"
          : "up",
    );
  }, []);

  return { onTouchEnd, onTouchStart };
}
