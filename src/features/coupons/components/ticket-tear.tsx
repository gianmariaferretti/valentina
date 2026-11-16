"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { formatStampDate } from "./coupon-ticket";
import styles from "./wallet.module.css";

const notifications = [
  "Gianmaria has been notified. Resistance is futile.",
  "Gianmaria has been notified. He is pretending to be calm.",
  "Notification delivered directly to Gianmaria's conscience.",
  "Gianmaria has been notified. Excuses are no longer accepted.",
  "Gianmaria has been notified. He said “oh no”, but happily.",
] as const;

interface TearContextValue {
  redeemedAt: string | null;
  torn: boolean;
  tear: (redeemedAt: string) => void;
}

const TearContext = createContext<TearContextValue | null>(null);

export function useTicketTear() {
  return useContext(TearContext);
}

/**
 * Coordinates the redemption moment on the coupon page: the stub tears off,
 * the stamp lands, the phone buzzes and a fake system notification appears.
 * Purely cosmetic — the redemption itself is already saved when this runs.
 */
export function TicketTearProvider({
  children,
  initialRedeemedAt,
}: {
  children: ReactNode;
  initialRedeemedAt: string | null;
}) {
  const router = useRouter();
  const [redeemedAt, setRedeemedAt] = useState(initialRedeemedAt);
  const [torn, setTorn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const tear = useCallback(
    (value: string) => {
      setRedeemedAt(value);
      setTorn(true);
      try {
        navigator.vibrate?.([18, 40, 30]);
      } catch {
        // Vibration is optional.
      }
      setToast(notifications[Math.floor(Math.random() * notifications.length)]);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 5200);
      window.setTimeout(() => router.refresh(), 1400);
    },
    [router],
  );

  const value = useMemo(
    () => ({ redeemedAt, torn, tear }),
    [redeemedAt, torn, tear],
  );

  return (
    <TearContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.toast}
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 24 }}
            role="status"
          >
            <span aria-hidden="true" className={styles.toastIcon}>
              💌
            </span>
            <span>
              <span className="block text-[0.58rem] font-bold tracking-[0.16em] text-white/70 uppercase">
                V&amp;G System · now
              </span>
              <span className="mt-1 block text-sm leading-5">{toast}</span>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TearContext.Provider>
  );
}

const jagged =
  "polygon(0 6px, 6% 0, 13% 5px, 21% 1px, 29% 6px, 37% 0, 45% 5px, 53% 1px, 61% 6px, 69% 0, 77% 5px, 85% 1px, 93% 6px, 100% 0, 100% 100%, 0 100%)";

/** The detachable stub at the foot of the coupon page. */
export function TicketStub({ children }: { children: ReactNode }) {
  const context = useTicketTear();
  const reducedMotion = useReducedMotion();
  if (!context || (context.redeemedAt && !context.torn)) return null;
  return (
    <AnimatePresence>
      {context.torn ? null : (
        <motion.div
          className="mt-8 border-t-2 border-dashed border-[var(--line-strong)] pt-6"
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0.3 } }
              : {
                  clipPath: jagged,
                  x: [0, 6, 40],
                  y: [0, -6, 320],
                  rotate: [0, -4, 18],
                  opacity: [1, 1, 0],
                  transition: {
                    duration: 1.1,
                    times: [0, 0.18, 1],
                    ease: "easeIn",
                  },
                }
          }
          key="stub"
          style={{ transformOrigin: "0% 0%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The REDEEMED stamp, landing like a real rubber stamp. */
export function RedeemedStamp() {
  const context = useTicketTear();
  const reducedMotion = useReducedMotion();
  if (!context?.redeemedAt) return null;
  return (
    <motion.p
      animate={
        reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -11 }
      }
      aria-live="polite"
      className={styles.stamp}
      initial={
        context.torn
          ? reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 2.2, rotate: -4 }
          : false
      }
      style={{ bottom: "5.5rem", right: "1.75rem" }}
      transition={{
        delay: context.torn ? 0.55 : 0,
        duration: 0.28,
        ease: [0.3, 1.6, 0.6, 1],
      }}
    >
      <strong>REDEEMED</strong>
      <span>{formatStampDate(context.redeemedAt)}</span>
    </motion.p>
  );
}
