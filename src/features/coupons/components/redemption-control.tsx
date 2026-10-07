"use client";

import { ArrowRight, Check, LockKeyhole, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { redeemCoupon } from "@/features/coupons/actions/redeem-coupon";
import type { CouponStatus, CouponType } from "@/features/coupons/types";

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
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status === "redeemed") {
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

  if (type === "challenge" && challengeId) {
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

  function confirmRedemption() {
    startTransition(() => {
      void redeemCoupon(couponId).then((result) => {
        setFeedback(result.message);
        if (result.status === "success") {
          setIsConfirming(false);
          router.refresh();
        }
      });
    });
  }

  return (
    <>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--rust)] px-5 text-[0.68rem] font-bold tracking-[0.15em] text-white uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
        onClick={() => {
          setFeedback(null);
          setIsConfirming(true);
        }}
        type="button"
      >
        Redeem coupon
        <ArrowRight aria-hidden="true" size={15} />
      </button>

      {feedback ? (
        <p
          className="mt-3 text-center text-xs leading-5 text-[var(--rust)]"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      {isConfirming ? (
        <div
          aria-labelledby="redemption-title"
          aria-modal="true"
          className="fixed inset-0 z-[80] grid place-items-center bg-[var(--ink)]/65 p-5 backdrop-blur-sm"
          role="dialog"
        >
          <div className="relative w-full max-w-md rounded-[1.75rem] bg-[var(--paper-white)] p-7 shadow-[var(--shadow-lifted)] sm:p-9">
            <button
              aria-label="Cancel redemption"
              className="absolute top-5 right-5 grid size-11 place-items-center rounded-full border border-[var(--line)] transition hover:bg-[var(--paper)]"
              disabled={isPending}
              onClick={() => setIsConfirming(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
            <p className="text-[0.6rem] font-bold tracking-[0.18em] text-[var(--rust)] uppercase">
              Final confirmation
            </p>
            <h2
              className="mt-4 max-w-xs font-display text-4xl leading-[0.95] tracking-[-0.04em]"
              id="redemption-title"
            >
              Redeem {title}?
            </h2>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              This will permanently mark the coupon as redeemed in
              Valentina&apos;s wallet. Dramatic consequences may follow.
            </p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              <button
                className="min-h-12 rounded-full border border-[var(--line-strong)] px-5 text-[0.65rem] font-bold tracking-[0.13em] uppercase"
                disabled={isPending}
                onClick={() => setIsConfirming(false)}
                type="button"
              >
                Not yet
              </button>
              <button
                className="min-h-12 rounded-full bg-[var(--rust)] px-5 text-[0.65rem] font-bold tracking-[0.13em] text-white uppercase disabled:opacity-50"
                disabled={isPending}
                onClick={confirmRedemption}
                type="button"
              >
                {isPending ? "Redeeming…" : "Yes, redeem"}
              </button>
            </div>
            {feedback ? (
              <p className="mt-4 text-sm text-[var(--rust)]" role="alert">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
