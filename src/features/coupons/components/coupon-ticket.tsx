"use client";

import { ArrowUpRight, Dices, Sparkles, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { ScratchSurface } from "@/components/ui/scratch-surface";
import type { CouponWalletItem } from "@/features/coupons/types";
import { useHoloTilt } from "@/hooks/use-holo-tilt";
import { cn } from "@/lib/cn";

import styles from "./wallet.module.css";

export function formatStampDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .toUpperCase();
}

const statusLabels = {
  available: "Available",
  redeemed: "Redeemed",
  locked: "Sealed",
  undiscovered: "Undiscovered",
} as const;

interface CouponTicketProps {
  coupon: CouponWalletItem;
  /** Covered by a scratch foil until revealed for the first time. */
  covered?: boolean;
  onScratched?: (id: string) => void;
  glow?: boolean;
}

export function CouponTicket({
  coupon,
  covered = false,
  onScratched,
  glow = false,
}: CouponTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const rarity = coupon.rarity ?? "standard";
  useHoloTilt(
    ticketRef,
    coupon.status !== "undiscovered" &&
      (rarity === "premium" || rarity === "legendary"),
  );

  if (coupon.status === "undiscovered") {
    return (
      <div
        className={cn(styles.ticket, styles.undiscovered)}
        data-rarity="standard"
      >
        <div className={styles.body}>
          <div className="flex items-start justify-between">
            <span className={styles.code}>GV-???</span>
          </div>
          <span aria-hidden="true" className={styles.mystery}>
            ?
          </span>
          <h3 className="sr-only">Undiscovered coupon</h3>
          <p className="text-center text-sm leading-6 text-[var(--muted)]">
            {coupon.shortDescription}
          </p>
          <div className={styles.footer}>
            <span className="text-[var(--muted)]">Keep looking</span>
          </div>
        </div>
        <div aria-hidden="true" className={styles.stub}>
          <span className={styles.stubLabel}>Unknown</span>
        </div>
      </div>
    );
  }

  const sealed = coupon.status === "locked";
  const redeemed = coupon.status === "redeemed";

  const ticket = (
    <div
      className={cn(
        styles.ticket,
        sealed && styles.sealed,
        glow && styles.glow,
      )}
      data-live="false"
      data-rarity={rarity}
      data-status={coupon.status}
      ref={ticketRef}
    >
      <div className={styles.body}>
        <span aria-hidden="true" className={styles.shine} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className={styles.code}>{coupon.code}</p>
            <p className={cn(styles.eyebrow, "mt-1.5")}>
              {coupon.category} · {rarity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {coupon.series ? (
              <span className={styles.seriesBadge}>
                {coupon.series.index} of {coupon.series.total}
              </span>
            ) : null}
            {coupon.source === "casino" ? (
              <Dices aria-label="Won at the Kiss Casino" size={19} />
            ) : redeemed ? (
              <TicketCheck aria-hidden="true" size={19} strokeWidth={1.5} />
            ) : rarity === "legendary" || rarity === "impossible" ? (
              <Sparkles aria-hidden="true" size={19} strokeWidth={1.5} />
            ) : (
              <ArrowUpRight aria-hidden="true" size={19} strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="relative my-auto py-7">
          <h3 className={styles.title}>{coupon.title}</h3>
          <p className={styles.description}>{coupon.shortDescription}</p>
        </div>

        <div className={cn(styles.footer, "relative")}>
          <span>{statusLabels[coupon.status]}</span>
          {coupon.callToAction && !redeemed ? (
            <span className="text-right">{coupon.callToAction}</span>
          ) : null}
        </div>

        {redeemed && coupon.redeemedAt ? (
          <p className={styles.stamp}>
            <strong>REDEEMED</strong>
            <span>{formatStampDate(coupon.redeemedAt)}</span>
          </p>
        ) : null}

        {sealed ? (
          <div className={styles.seal}>
            <span aria-hidden="true" className={styles.sealTape} />
            <span aria-hidden="true" className={styles.sealTape} />
            <p className={styles.sealNote}>
              {coupon.unlockCondition ?? "Sealed until further notice."}
            </p>
          </div>
        ) : null}
      </div>

      {redeemed ? null : (
        <div aria-hidden="true" className={styles.stub}>
          <span className={styles.stubLabel}>Admit one</span>
          <span className={styles.barcode} />
          <span className={styles.stubCode}>{coupon.code}</span>
        </div>
      )}
    </div>
  );

  if (covered) {
    return (
      <ScratchSurface
        className="rounded-[1.4rem]"
        coverText="FRESHLY WON · SCRATCH"
        onReveal={() => onScratched?.(coupon.id)}
        revealLabel={`Reveal ${coupon.code}`}
        tone="gold"
      >
        {ticket}
      </ScratchSurface>
    );
  }

  const label = redeemed
    ? `${coupon.title}, redeemed`
    : sealed
      ? `${coupon.title}, sealed. ${coupon.unlockCondition ?? ""}`
      : `${coupon.callToAction ?? "View"}: ${coupon.title}`;

  return coupon.href ? (
    <Link
      aria-label={label}
      className="block rounded-[1.4rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
      href={coupon.href}
    >
      {ticket}
    </Link>
  ) : (
    ticket
  );
}

export function AlbumStub({ coupon }: { coupon: CouponWalletItem }) {
  return (
    <Link
      className={cn(
        styles.albumStub,
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]",
      )}
      href={`/coupons/${coupon.id}`}
    >
      <span className={styles.code}>{coupon.code}</span>
      <span className="font-display text-xl leading-tight">{coupon.title}</span>
      {coupon.redeemedAt ? (
        <span className={styles.albumStamp}>
          USED · {formatStampDate(coupon.redeemedAt)}
        </span>
      ) : null}
    </Link>
  );
}
