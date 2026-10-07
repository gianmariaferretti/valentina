"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  type AccessActionState,
  verifyAccess,
} from "@/features/access/actions/verify-access";

const initialState: AccessActionState = { status: "idle" };

export function AccessForm() {
  const [state, formAction, isPending] = useActionState(
    verifyAccess,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8" noValidate>
      <label
        className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase"
        htmlFor="access-code"
      >
        The date you absolutely know
      </label>
      <div className="mt-3 flex items-center rounded-full border border-[var(--line-strong)] bg-white/55 p-1.5 pl-5 focus-within:border-[var(--ink)]">
        <LockKeyhole
          aria-hidden="true"
          className="text-[var(--muted)]"
          size={16}
        />
        <input
          aria-describedby="access-feedback"
          autoComplete="one-time-code"
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base tracking-[0.16em] outline-none placeholder:tracking-normal placeholder:text-[var(--muted)]/70"
          id="access-code"
          inputMode="numeric"
          maxLength={12}
          name="code"
          pattern="[0-9]*"
          placeholder="Enter the code"
          required
          type="password"
        />
        <Button aria-label="Enter Year One" disabled={isPending} type="submit">
          <span className="hidden sm:inline">
            {isPending ? "Checking" : "Enter"}
          </span>
          <ArrowRight aria-hidden="true" size={15} />
        </Button>
      </div>
      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-[var(--rust)]"
        id="access-feedback"
      >
        {state.message}
      </p>
    </form>
  );
}
