"use client";

import { X } from "lucide-react";
import { useRef, type RefObject } from "react";

import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";

/** Final confirmation before a coupon is redeemed. Shared by page and wallet. */
export function RedeemDialog({
  open,
  title,
  onCancel,
  onConfirm,
  returnFocusRef,
  casino = false,
}: {
  /** A coupon won at the Kiss Casino: redeeming it resets the casino. */
  casino?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: closeButtonRef,
    isOpen: open,
    onClose: onCancel,
    returnFocusRef,
  });
  if (!open) return null;
  return (
    <Portal>
      <div
        aria-labelledby="redemption-title"
        aria-modal="true"
        className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto overscroll-contain bg-[var(--ink)]/65 p-5 backdrop-blur-sm"
        onKeyDown={onKeyDown}
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) onCancel();
        }}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="relative w-full max-w-md rounded-[1.75rem] bg-[var(--paper-white)] p-7 text-[var(--ink)] shadow-[var(--shadow-lifted)] sm:p-9">
          <button
            aria-label="Cancel redemption"
            className="absolute top-5 right-5 grid size-11 place-items-center rounded-full border border-[var(--line)] transition hover:bg-[var(--paper)]"
            onClick={onCancel}
            ref={closeButtonRef}
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
            The stub tears off for good. Each coupon works once.
          </p>
          {casino ? (
            <p className="mt-3 rounded-2xl bg-[var(--paper)] px-4 py-3 text-sm leading-6">
              Won at the Kiss Casino: redeeming it resets the casino for a fresh
              start. Your other coupons stay in the wallet.
            </p>
          ) : null}
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-12 rounded-full border border-[var(--line-strong)] px-5 text-[0.65rem] font-bold tracking-[0.13em] uppercase"
              onClick={onCancel}
              type="button"
            >
              Not yet
            </button>
            <button
              className="min-h-12 rounded-full bg-[var(--rust)] px-5 text-[0.65rem] font-bold tracking-[0.13em] text-white uppercase"
              onClick={onConfirm}
              type="button"
            >
              Yes, redeem
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
