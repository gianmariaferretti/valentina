"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { redeemCoupon } from "@/features/coupons/actions/redeem-coupon";
import { cn } from "@/lib/cn";

import { formatStampDate } from "./stamp-date";
import styles from "./wallet.module.css";

/** How long the stub takes to peel off and fall (ms). */
const TEAR_MS = 950;
/** How long the rubber stamp takes to land (ms). */
const STAMP_MS = 480;
const REDUCED_MS = 260;

const notifications = [
  "Gianmaria has been notified. Resistance is futile.",
  "Gianmaria has been notified. He is pretending to be calm.",
  "Notification delivered directly to Gianmaria's conscience.",
  "Gianmaria has been notified. Excuses are no longer accepted.",
  "Gianmaria has been notified. He said “oh no”, but happily.",
] as const;

/**
 * idle      → the stub is attached.
 * tearing   → started on tap, while the server saves the redemption.
 * stamping  → the stub has fallen AND the server confirmed: the stamp lands.
 * done      → everything settled; the page refreshes only now.
 */
export type TearPhase = "idle" | "tearing" | "stamping" | "done";

interface TearContextValue {
  phase: TearPhase;
  /** Redeemed before this page was opened (static stamp, no stub). */
  initiallyRedeemed: boolean;
  redeemedAt: string | null;
  redeem: (couponId: string) => Promise<{ ok: boolean; message: string }>;
}

const TearContext = createContext<TearContextValue | null>(null);

export function useTicketTear() {
  return useContext(TearContext);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is optional.
  }
}

/**
 * Owns the whole redemption moment for one ticket. The tear starts on tap,
 * in parallel with the server action; the stamp only lands once the stub has
 * fallen and the redemption is saved; the page refreshes last, so nothing
 * interrupts the animation. A failed save puts the stub back.
 */
export function TicketTearProvider({
  children,
  initialRedeemedAt,
}: {
  children: ReactNode;
  initialRedeemedAt: string | null;
}) {
  const router = useRouter();
  const [initiallyRedeemed] = useState(initialRedeemedAt !== null);
  const [phase, setPhase] = useState<TearPhase>("idle");
  const [redeemedAt, setRedeemedAt] = useState(initialRedeemedAt);
  const busy = useRef(false);

  const redeem = useCallback(
    async (couponId: string) => {
      if (busy.current) return { ok: false, message: "Already redeeming." };
      busy.current = true;
      const reduced = prefersReducedMotion();
      setPhase("tearing");
      vibrate([12]);
      const [result] = await Promise.all([
        redeemCoupon(couponId).catch(() => ({
          status: "error" as const,
          message: "The connection dropped. Nothing was redeemed — try again.",
          redeemedAt: undefined,
        })),
        wait(reduced ? REDUCED_MS : TEAR_MS),
      ]);
      if (result.status !== "success" || !result.redeemedAt) {
        setPhase("idle");
        busy.current = false;
        return { ok: false, message: result.message };
      }
      setRedeemedAt(result.redeemedAt);
      setPhase("stamping");
      vibrate([28, 40, 28]);
      await wait(reduced ? REDUCED_MS : STAMP_MS);
      setPhase("done");
      // Global toast: it survives the ticket re-rendering after the refresh.
      toast(notifications[Math.floor(Math.random() * notifications.length)], {
        description: "V&G System · now",
        icon: "💌",
        duration: 5000,
      });
      if (result.casinoReset)
        toast("The Kiss Casino has been reset — fresh start, new luck.", {
          description: "Your other coupons are safe in the wallet.",
          icon: "🎰",
          duration: 6000,
        });
      // Only now: fetch the saved state for the rest of the page.
      router.refresh();
      return { ok: true, message: result.message };
    },
    [router],
  );

  const value = useMemo(
    () => ({ phase, initiallyRedeemed, redeemedAt, redeem }),
    [phase, initiallyRedeemed, redeemedAt, redeem],
  );

  return <TearContext.Provider value={value}>{children}</TearContext.Provider>;
}

/** Zig-zag edge along the perforation, for each orientation. */
const jaggedTop =
  "polygon(0 7px, 5% 1px, 10% 6px, 15% 0, 20% 7px, 25% 2px, 30% 6px, 35% 0, 40% 7px, 45% 1px, 50% 6px, 55% 0, 60% 7px, 65% 2px, 70% 6px, 75% 0, 80% 7px, 85% 1px, 90% 6px, 95% 0, 100% 6px, 100% 100%, 0 100%)";
const jaggedLeft =
  "polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 95%, 6px 90%, 1px 85%, 7px 80%, 0 75%, 6px 70%, 1px 65%, 7px 60%, 0 55%, 6px 50%, 1px 45%, 7px 40%, 0 35%, 6px 30%, 1px 25%, 7px 20%, 0 15%, 6px 10%, 1px 5%)";

/**
 * The detachable stub. It peels up a little along the perforation, then falls
 * and spins away. With reduced motion it simply fades.
 */
export function TicketStub({
  children,
  className,
  orientation = "horizontal",
  wrapperClassName,
}: {
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  wrapperClassName?: string;
}) {
  const context = useTicketTear();
  const reducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const phase = context?.phase ?? "idle";

  // Horizontal stubs: hold the space while falling, then close the gap.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || orientation !== "horizontal") return;
    if (phase === "tearing") {
      wrapper.style.height = `${wrapper.offsetHeight}px`;
    } else if (phase === "stamping" || phase === "done") {
      wrapper.style.transition = "height 320ms ease";
      wrapper.style.height = "0px";
    } else {
      wrapper.style.height = "";
      wrapper.style.transition = "";
    }
  }, [phase, orientation]);

  if (context?.initiallyRedeemed) return null;
  const attached = phase === "idle";
  const horizontal = orientation === "horizontal";

  return (
    <div
      className={cn(wrapperClassName, horizontal && "overflow-visible")}
      ref={wrapperRef}
    >
      <AnimatePresence initial={false}>
        {attached ? (
          <motion.div
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            className={className}
            data-ticket-stub=""
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: REDUCED_MS / 1000 } }
                : {
                    clipPath: horizontal ? jaggedTop : jaggedLeft,
                    x: horizontal ? [0, 4, 46] : [0, 8, 70],
                    y: horizontal ? [0, -7, 460] : [0, -4, 520],
                    rotate: horizontal ? [0, -4, 26] : [0, 5, 34],
                    opacity: [1, 1, 0],
                    transition: {
                      duration: TEAR_MS / 1000,
                      times: [0, 0.2, 1],
                      ease: ["easeOut", [0.55, 0, 0.95, 0.4]],
                    },
                  }
            }
            initial={{ opacity: 0, y: -6 }}
            key="stub"
            style={{
              transformOrigin: horizontal ? "6% 0%" : "0% 8%",
              position: "relative",
              zIndex: 30,
            }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** The REDEEMED stamp: lands only after the stub has fallen. */
export function RedeemedStamp({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const context = useTicketTear();
  const reducedMotion = useReducedMotion();
  if (!context?.redeemedAt) return null;
  const landing = context.phase === "stamping" || context.phase === "done";
  if (!context.initiallyRedeemed && !landing) return null;
  return (
    <motion.p
      animate={
        reducedMotion
          ? { opacity: 1 }
          : { opacity: 1, scale: [2.3, 0.92, 1], rotate: [-3, -12, -11] }
      }
      aria-live="polite"
      className={cn(styles.stamp, className)}
      initial={
        context.initiallyRedeemed
          ? false
          : reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 2.3, rotate: -3 }
      }
      style={style}
      transition={{
        duration: reducedMotion ? REDUCED_MS / 1000 : STAMP_MS / 1000,
        times: reducedMotion ? undefined : [0, 0.7, 1],
        ease: "easeOut",
      }}
    >
      <strong>REDEEMED</strong>
      <span>{formatStampDate(context.redeemedAt)}</span>
    </motion.p>
  );
}

/** Shows the pre-redemption status until the animation has finished. */
export function TearAwareStatus({ status }: { status: string }) {
  const context = useTicketTear();
  if (!context || context.initiallyRedeemed) return <>{status}</>;
  return <>{context.phase === "done" ? "redeemed" : status}</>;
}
