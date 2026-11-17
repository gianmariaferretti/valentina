"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./cover.module.css";

const TEAR_AT = 70;

/**
 * "Enter" as a boarding pass: drag the stub to tear it off and board.
 * Decorative for assistive tech; the text link next to it does the same.
 */
export function BoardingPass() {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [0, TEAR_AT * 2], [0, 8]);
  const opacity = useTransform(x, [0, 220, 260], [1, 1, 0]);
  const [torn, setTorn] = useState(false);

  useEffect(() => {
    router.prefetch("/access");
  }, [router]);

  async function tear() {
    setTorn(true);
    try {
      navigator.vibrate?.([12, 40, 18]);
    } catch {
      // Optional.
    }
    await animate(x, 260, { duration: 0.45, ease: [0.3, 0, 0.6, 1] });
    router.push("/access");
  }

  return (
    <div aria-hidden="true" className={styles.pass}>
      <div className={styles.main}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={styles.label}>Boarding pass</span>
          <span className={styles.label}>Gate ♥</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <span className={styles.label}>From</span>
            <p className={styles.value}>Year One</p>
          </div>
          <span className="pb-1 text-lg">✈︎</span>
          <div className="text-right">
            <span className={styles.label}>To</span>
            <p className={styles.value}>Year Two</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between gap-2">
          <div>
            <span className={styles.label}>Passengers</span>
            <p className="text-sm font-semibold">V + G</p>
          </div>
          <div className="text-right">
            <span className={styles.label}>Seat</span>
            <p className="text-sm font-semibold">Together</p>
          </div>
        </div>
      </div>
      <motion.div
        className={`${styles.stub} ${!reduced && !torn ? styles.nudge : ""}`}
        drag={reduced || torn ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.9 }}
        dragSnapToOrigin={!torn}
        onDragEnd={(_, info) => {
          if (info.offset.x > TEAR_AT) void tear();
        }}
        style={{
          x,
          rotate,
          opacity,
          transformOrigin: "0% 100%",
        }}
      >
        <span className={styles.label}>Admit two</span>
        <span className={styles.barcode} />
        <span className={styles.hint}>
          {torn ? "Boarding…" : "Tear to enter →"}
        </span>
      </motion.div>
    </div>
  );
}
