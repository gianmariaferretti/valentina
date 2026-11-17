"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { buttonClass, type Tone } from "./styles";

export { buttonClass, inputClass } from "./styles";

export interface ActionResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Shows the result as a toast; offers "Annulla" when an undo is given. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function run(
    action: () => Promise<ActionResult>,
    undo?: () => Promise<ActionResult>,
  ) {
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, message: "Connessione persa. Riprova." };
      }
      if (result.ok) {
        toast.success(result.message, {
          action: undo
            ? {
                label: "Annulla",
                onClick: () =>
                  void undo().then((back) => {
                    toast(back.message);
                    router.refresh();
                  }),
              }
            : undefined,
          duration: undo ? 8000 : 4000,
        });
        router.refresh();
      } else toast.error(result.message);
    });
  }
  return { pending, run };
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  returnFocusRef,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: cancelRef,
    isOpen: open,
    onClose: onCancel,
    returnFocusRef,
  });
  if (!open) return null;
  return (
    <Portal>
      <div
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="w-full max-w-sm rounded-3xl bg-[var(--paper-white)] p-6 shadow-xl">
          <h2 className="font-display text-2xl" id="confirm-title">
            {title}
          </h2>
          <div className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {body}
          </div>
          <div className="mt-6 grid gap-2">
            <button
              className={buttonClass("danger", "w-full")}
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
            <button
              className={buttonClass("ghost", "w-full")}
              onClick={onCancel}
              ref={cancelRef}
              type="button"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/**
 * A button bound to a server action. With `confirm` it asks first (for
 * destructive actions); with `undo` the toast offers "Annulla".
 */
export function ActionButton({
  action,
  undo,
  children,
  tone = "ghost",
  confirm,
  className,
}: {
  action: () => Promise<ActionResult>;
  undo?: () => Promise<ActionResult>;
  children: ReactNode;
  tone?: Tone;
  confirm?: { title: string; body: ReactNode; confirmLabel: string };
  className?: string;
}) {
  const { pending, run } = useAdminAction();
  const [asking, setAsking] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        className={buttonClass(tone, className)}
        disabled={pending}
        onClick={() => (confirm ? setAsking(true) : run(action, undo))}
        ref={buttonRef}
        type="button"
      >
        {pending ? "…" : children}
      </button>
      {confirm ? (
        <ConfirmDialog
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            run(action, undo);
          }}
          open={asking}
          returnFocusRef={buttonRef}
          title={confirm.title}
        />
      ) : null}
    </>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-[var(--muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
