"use client";

import { ArrowRight, Check, LockKeyhole, Trophy } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import type { CouponStatus, CouponType } from "@/features/coupons/types";

import { RedeemDialog } from "./redeem-dialog";
import { useTicketTear } from "./ticket-tear";

interface RedemptionControlProps {
  couponId: string;
  title: string;
  status: CouponStatus;
  type: CouponType;
  redeemable: boolean;
  challengeId: string | null;
  unlockCondition: string | null;
  redeemedAt: string | null;
}

function formatRedeemedAt(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function RedeemedPanel({ redeemedAt }: { redeemedAt: string | null }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--red-muted)]/45 bg-[var(--red-muted)]/8 p-5">
      <div className="flex items-center gap-3 text-[var(--rust)]">
        <Check aria-hidden="true" size={19} strokeWidth={1.8} />
        <p className="text-[0.62rem] font-bold tracking-[0.16em] uppercase">
          Redeemed
        </p>
      </div>
      <p className="mt-3 font-display text-2xl">
        {redeemedAt ? formatRedeemedAt(redeemedAt) : "Date unavailable"}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Officially used. The archive remembers everything.
      </p>
    </div>
  );
}

export function RedemptionControl({
  couponId,
  title,
  status,
  type,
  redeemable,
  challengeId,
  unlockCondition,
  redeemedAt,
}: RedemptionControlProps) {
  const tear = useTicketTear();
  const phase = tear?.phase ?? "idle";
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const redeemButtonRef = useRef<HTMLButtonElement>(null);

  if (status === "redeemed" || phase === "done") {
    return <RedeemedPanel redeemedAt={tear?.redeemedAt ?? redeemedAt} />;
  }

  if (type === "challenge" && challengeId && !redeemable) {
    return (
      <div>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[0.68rem] font-bold tracking-[0.15em] text-[var(--paper-white)] uppercase transition hover:bg-[var(--oxblood)]"
          href={`/challenges/${challengeId}`}
        >
          <Trophy aria-hidden="true" size={17} />
          Win to redeem
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
        <p className="mt-3 text-center text-xs leading-5 text-[var(--muted)]">
          {unlockCondition}
        </p>
      </div>
    );
  }

  if (status === "locked" || !redeemable) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-[var(--line-strong)] p-5 text-[var(--muted)]">
        <LockKeyhole aria-hidden="true" size={19} />
        <p className="mt-3 text-sm leading-6">
          {unlockCondition ?? "This coupon is not redeemable yet."}
        </p>
      </div>
    );
  }

  const inProgress = phase === "tearing" || phase === "stamping";

  function confirmRedemption() {
    setIsConfirming(false);
    setFeedback(null);
    if (!tear) return;
    // The tear starts right now; the save happens in parallel.
    void tear.redeem(couponId).then((result) => {
      if (!result.ok) setFeedback(result.message);
    });
  }

  return (
    <>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--rust)] px-5 text-[0.68rem] font-bold tracking-[0.15em] text-white uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] disabled:opacity-70"
        disabled={inProgress}
        onClick={() => {
          setFeedback(null);
          setIsConfirming(true);
        }}
        ref={redeemButtonRef}
        type="button"
      >
        {inProgress ? "Redeeming…" : "Redeem coupon"}
        {inProgress ? null : <ArrowRight aria-hidden="true" size={15} />}
      </button>

      {feedback ? (
        <p
          className="mt-3 text-center text-xs leading-5 text-[var(--rust)]"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}

      <RedeemDialog
        casino={couponId.startsWith("casino-")}
        onCancel={() => setIsConfirming(false)}
        onConfirm={confirmRedemption}
        open={isConfirming}
        returnFocusRef={redeemButtonRef}
        title={title}
      />
    </>
  );
}
