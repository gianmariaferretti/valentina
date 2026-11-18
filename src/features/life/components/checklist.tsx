"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { ink, Mark } from "@/components/annotations/mark";

import { proposeListItem, toggleListItem } from "../actions/lists";
import type { ListItem } from "../repositories/life";

/** A list both of us can tick; Valentina can also propose new things. */
export function Checklist({
  items,
  list,
  title,
  emptyText,
  canPropose,
}: {
  items: ListItem[];
  list: "todo" | "suitcase";
  title: string;
  emptyText: string;
  canPropose: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (state, change: { id: string; done: boolean }) =>
      state.map((item) =>
        item.id === change.id
          ? { ...item, doneAt: change.done ? new Date().toISOString() : null }
          : item,
      ),
  );
  const [proposing, setProposing] = useState(false);
  const active = optimistic.filter((item) => item.status === "active");
  const proposed = optimistic.filter((item) => item.status === "proposed");
  const doneCount = active.filter((item) => item.doneAt).length;

  return (
    <section
      aria-labelledby={`${list}-title`}
      className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper-white)] p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl" id={`${list}-title`}>
          {title}
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {doneCount} / {active.length}
        </span>
      </div>
      {active.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{emptyText}</p>
      ) : (
        <ul className="mt-3 grid gap-1">
          {active.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--paper)]">
                <input
                  checked={Boolean(item.doneAt)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--rust)]"
                  disabled={pending}
                  onChange={(event) => {
                    const done = event.target.checked;
                    startTransition(async () => {
                      setOptimistic({ id: item.id, done });
                      const result = await toggleListItem(item.id, done);
                      if (result.ok) {
                        if (
                          result.message.includes("💋") ||
                          result.message.includes("coupon")
                        )
                          toast(result.message, { icon: "🎁" });
                      } else toast(result.message);
                      router.refresh();
                    });
                  }}
                  type="checkbox"
                />
                <span
                  className={
                    item.doneAt
                      ? list === "suitcase"
                        ? "text-[var(--muted)]"
                        : "text-[var(--muted)] line-through"
                      : ""
                  }
                >
                  {list === "suitcase" ? (
                    // Packed: struck through by hand, like on a paper list.
                    <Mark
                      active={Boolean(item.doneAt)}
                      color={ink.rust}
                      multiline
                      strokeWidth={1.5}
                      type="strike-through"
                    >
                      {item.title}
                    </Mark>
                  ) : (
                    item.title
                  )}
                  {item.notes ? (
                    <span className="block text-xs text-[var(--muted)] no-underline">
                      {item.notes}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {proposed.length ? (
        <ul className="mt-3 grid gap-1 border-t border-dashed border-[var(--line-strong)] pt-3 text-sm">
          {proposed.map((item) => (
            <li className="text-[var(--muted)]" key={item.id}>
              💡 {item.title}{" "}
              <span className="text-xs">· waiting for Gianmaria&apos;s OK</span>
            </li>
          ))}
        </ul>
      ) : null}
      {canPropose ? (
        proposing ? (
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const element = event.currentTarget;
              startTransition(async () => {
                const result = await proposeListItem(list, form);
                toast(result.message);
                if (result.ok) {
                  element.reset();
                  setProposing(false);
                  router.refresh();
                }
              });
            }}
          >
            <input
              aria-label="Your idea"
              autoFocus
              className="min-h-11 min-w-0 flex-1 rounded-full border border-[var(--line-strong)] bg-white px-4 text-base"
              maxLength={140}
              name="title"
              placeholder="Your idea…"
              required
            />
            <button
              className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper-white)]"
              disabled={pending}
              type="submit"
            >
              Propose
            </button>
          </form>
        ) : (
          <button
            className="mt-3 min-h-11 text-sm text-[var(--rust)] underline-offset-4 hover:underline"
            onClick={() => setProposing(true)}
            type="button"
          >
            + Propose something
          </button>
        )
      ) : null}
    </section>
  );
}
