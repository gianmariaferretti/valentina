"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";

import { markHeartSeen } from "../actions/love";
import styles from "./love.module.css";

interface Heart {
  id: string;
  message: string | null;
}

const POLL_MS = 30_000;

/**
 * Shows Gianmaria's hearts: on opening the site, and while it is open
 * (a light check every 30 seconds, only when the page is visible).
 */
export function HeartListener() {
  const [heart, setHeart] = useState<Heart | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const showing = useRef(false);

  const check = useCallback(async () => {
    if (showing.current || document.visibilityState !== "visible") return;
    try {
      const response = await fetch("/api/hearts", { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { heart: Heart | null };
      if (body.heart) {
        showing.current = true;
        setHeart(body.heart);
        try {
          navigator.vibrate?.([30, 60, 30]);
        } catch {
          // Optional.
        }
      }
    } catch {
      // Offline: try again later.
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void check(), 800);
    const timer = window.setInterval(() => void check(), POLL_MS);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  const close = useCallback(() => {
    if (heart) void markHeartSeen(heart.id);
    showing.current = false;
    setHeart(null);
  }, [heart]);

  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: closeRef,
    isOpen: heart !== null,
    onClose: close,
  });

  if (!heart) return null;
  return (
    <Portal>
      <div
        aria-labelledby="heart-title"
        aria-modal="true"
        className={styles.overlay}
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.card}>
          <span aria-hidden="true" className={styles.bigHeart}>
            ❤️
          </span>
          <h2 className="font-display text-3xl leading-tight" id="heart-title">
            Gianmaria sent you a heart
          </h2>
          {heart.message ? (
            <p className="text-base leading-6 text-[var(--ink-soft)]">
              “{heart.message}”
            </p>
          ) : null}
          <button
            className="mt-2 min-h-12 w-full rounded-full bg-[var(--ink)] px-5 font-semibold text-[var(--paper-white)]"
            onClick={close}
            ref={closeRef}
            type="button"
          >
            ❤️ Keep it
          </button>
        </div>
      </div>
    </Portal>
  );
}
