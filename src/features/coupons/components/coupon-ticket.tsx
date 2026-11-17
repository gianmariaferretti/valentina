"use client";

import { ArrowUpRight, Dices, Sparkles, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { ScratchSurface } from "@/components/ui/scratch-surface";
import type { CouponWalletItem } from "@/features/coupons/types";
import { useHoloTilt } from "@/hooks/use-holo-tilt";
import { cn } from "@/lib/cn";

import { RedeemDialog } from "./redeem-dialog";
import { formatStampDate } from "./stamp-date";
import {
  RedeemedStamp,
  TicketStub,
  TicketTearProvider,
  useTicketTear,
} from "./ticket-tear";
import styles from "./wallet.module.css";

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
  /** The card in the foreground (coupon of the day): always shimmering. */
  featured?: boolean;
}

/**
 * A wallet ticket. Available, redeemable coupons can be redeemed right here:
 * the same confirmation and the same tear as on the coupon page.
 */
export function CouponTicket(props: CouponTicketProps) {
  const { coupon, covered = false } = props;
  if (coupon.status === "available" && coupon.redeemable && !covered) {
    return (
      <TicketTearProvider initialRedeemedAt={null}>
        <RedeemableTicket {...props} />
      </TicketTearProvider>
    );
  }
  return <TicketView {...props} />;
}

function RedeemableTicket(props: CouponTicketProps) {
  const tear = useTicketTear();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const phase = tear?.phase ?? "idle";
  const active = phase !== "idle";
  return (
    // Lifted above neighbouring cards while the stub falls over them.
    <div
      className={cn("relative", active && "z-40")}
      data-coupon-id={props.coupon.id}
    >
      <TicketView {...props} redeemSlot />
      {phase === "idle" || phase === "tearing" ? (
        <button
          aria-label={`Redeem ${props.coupon.title}`}
          className={styles.redeemButton}
          disabled={active}
          onClick={() => {
            setFeedback(null);
            setConfirming(true);
          }}
          ref={buttonRef}
          type="button"
        >
          {active ? "Redeeming…" : "Redeem"}
        </button>
      ) : null}
      {feedback ? (
        <p className="mt-2 text-center text-xs text-[var(--rust)]" role="alert">
          {feedback}
        </p>
      ) : null}
      <RedeemDialog
        casino={props.coupon.id.startsWith("casino-")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void tear?.redeem(props.coupon.id).then((result) => {
            if (!result.ok) setFeedback(result.message);
          });
        }}
        open={confirming}
        returnFocusRef={buttonRef}
        title={props.coupon.title}
      />
    </div>
  );
}

function TicketView({
  coupon,
  covered = false,
  onScratched,
  glow = false,
  featured = false,
  redeemSlot = false,
}: CouponTicketProps & { redeemSlot?: boolean }) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const tear = useTicketTear();
  const phase = tear?.phase ?? "idle";
  const rarity = coupon.rarity ?? "standard";
  useHoloTilt(
    ticketRef,
    coupon.status !== "undiscovered" &&
      (rarity === "premium" ||
        rarity === "legendary" ||
        rarity === "impossible"),
    featured,
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
  const redeemed = coupon.status === "redeemed" || phase === "done";
  const torn = phase === "stamping" || phase === "done";

  const ticket = (
    <div
      className={cn(
        styles.ticket,
        sealed && styles.sealed,
        glow && styles.glow,
      )}
      data-live="false"
      data-rarity={rarity}
      data-status={redeemed ? "redeemed" : coupon.status}
      data-torn={phase === "tearing" ? "tearing" : torn ? "gone" : undefined}
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
          {/* The Redeem button sits over this corner on redeemable tickets. */}
          <span>
            {redeemSlot && !redeemed
              ? ""
              : statusLabels[redeemed ? "redeemed" : coupon.status]}
          </span>
          {coupon.callToAction && !redeemed ? (
            <span className="text-right">{coupon.callToAction}</span>
          ) : null}
        </div>

        {coupon.status === "redeemed" && coupon.redeemedAt && !tear ? (
          <p className={styles.stamp}>
            <strong>REDEEMED</strong>
            <span>{formatStampDate(coupon.redeemedAt)}</span>
          </p>
        ) : null}
        {tear ? <RedeemedStamp /> : null}

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

      {coupon.status === "redeemed" ? null : tear ? (
        <TicketStub
          className={styles.stub}
          orientation="vertical"
          wrapperClassName={styles.stubSlot}
        >
          <span aria-hidden="true" className={styles.stubLabel}>
            Admit one
          </span>
          <span aria-hidden="true" className={styles.barcode} />
          <span aria-hidden="true" className={styles.stubCode}>
            {coupon.code}
          </span>
        </TicketStub>
      ) : (
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
