"use client";

import { ArrowRight, BadgeCheck, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  type AccessActionState,
  verifyAccess,
} from "@/features/access/actions/verify-access";

const initialState: AccessActionState = { status: "idle", attempts: 0 };

export function AccessForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    verifyAccess,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success") return;

    const transition = window.setTimeout(() => {
      router.replace("/home");
      router.refresh();
    }, 1100);

    return () => window.clearTimeout(transition);
  }, [router, state.status]);

  if (state.status === "success") {
    return (
      <div
        aria-live="polite"
        className="flex min-h-64 flex-col justify-center rounded-[1.5rem] bg-[var(--ink)] p-7 text-[var(--paper-white)]"
      >
        <BadgeCheck
          aria-hidden="true"
          className="text-[var(--sticker-green)]"
          size={34}
          strokeWidth={1.5}
        />
        <p className="mt-6 text-[0.64rem] font-bold tracking-[0.2em] text-white/55 uppercase">
          Identity verified
        </p>
        <p className="mt-2 font-display text-3xl italic">{state.message}</p>
        <p className="mt-7 text-xs tracking-[0.12em] text-white/45 uppercase">
          Opening Year One…
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      <label
        className="text-[0.62rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase"
        htmlFor="access-code"
      >
        Access code
      </label>
      <div className="mt-3 flex items-center rounded-full border border-[var(--line-strong)] bg-white/65 p-1.5 pl-4 focus-within:border-[var(--ink)]">
        <LockKeyhole
          aria-hidden="true"
          className="shrink-0 text-[var(--muted)]"
          size={16}
        />
        <input
          aria-describedby="access-feedback"
          autoComplete="one-time-code"
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base tracking-[0.16em] outline-none placeholder:tracking-normal placeholder:text-[var(--muted)]/70"
          id="access-code"
          inputMode="numeric"
          maxLength={32}
          name="code"
          placeholder="Enter the code"
          required
          type="password"
        />
        <Button
          aria-label="Verify identity"
          className="shrink-0 px-4 sm:px-5"
          disabled={isPending}
          type="submit"
        >
          <span className="hidden sm:inline">
            {isPending ? "Checking" : "Verify"}
          </span>
          <ArrowRight aria-hidden="true" size={15} />
        </Button>
      </div>
      <p
        aria-live="polite"
        className="mt-4 min-h-12 border-l-2 border-[var(--rust)] pl-3 text-sm leading-5 text-[var(--rust)]"
        id="access-feedback"
      >
        {state.message}
      </p>
    </form>
  );
}
