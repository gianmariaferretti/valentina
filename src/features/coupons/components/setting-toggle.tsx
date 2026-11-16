"use client";

import type { CouponSetting } from "@/features/coupons/types";

import styles from "./wallet.module.css";

interface SettingToggleProps {
  mode: CouponSetting;
  counts: Record<CouponSetting, number>;
  onChange: (mode: CouponSetting) => void;
}

/** A scrapbook lever between in-person and long-distance coupons. */
export function SettingToggle({ mode, counts, onChange }: SettingToggleProps) {
  return (
    <div
      aria-label="Choose a wallet section"
      className={styles.toggle}
      data-mode={mode}
      role="group"
    >
      <span aria-hidden="true" className={styles.toggleKnob} />
      <button
        aria-pressed={mode === "together"}
        className={styles.toggleOption}
        onClick={() => onChange("together")}
        type="button"
      >
        <TogetherIllustration />
        <span className={styles.toggleLabel}>Together</span>
        <span className={styles.toggleCount}>
          In person · {counts.together}
        </span>
      </button>
      <button
        aria-pressed={mode === "apart"}
        className={styles.toggleOption}
        onClick={() => onChange("apart")}
        type="button"
      >
        <ApartIllustration />
        <span className={styles.toggleLabel}>Apart</span>
        <span className={styles.toggleCount}>
          Long distance · {counts.apart}
        </span>
      </button>
    </div>
  );
}

function TogetherIllustration() {
  return (
    <svg
      aria-hidden="true"
      className={styles.illustration}
      viewBox="0 0 112 48"
    >
      <g className={styles.figures}>
        <circle cx="46" cy="14" fill="currentColor" r="6" />
        <path d="M36 46c0-11 4-20 10-20s10 9 10 20z" fill="currentColor" />
        <circle cx="66" cy="14" fill="var(--rust)" r="6" />
        <path d="M56 46c0-11 4-20 10-20s10 9 10 20z" fill="var(--rust)" />
      </g>
      <path
        d="M56 6c-2-3-7-2-6 2 0 3 6 6 6 6s6-3 6-6c1-4-4-5-6-2z"
        fill="var(--red-muted)"
      />
    </svg>
  );
}

function ApartIllustration() {
  return (
    <svg
      aria-hidden="true"
      className={styles.illustration}
      viewBox="0 0 112 48"
    >
      <path
        className={styles.dash}
        d="M 14 30 Q 56 -6 98 30"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="14" cy="32" fill="currentColor" r="5" />
      <circle cx="98" cy="32" fill="var(--rust)" r="5" />
      <g className={styles.plane}>
        <path
          d="M-7 0 7 0M2-5 7 0 2 5M-4 0-7-4M-4 0-7 4"
          fill="none"
          stroke="var(--ink)"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
