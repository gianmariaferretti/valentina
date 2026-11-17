"use client";

import { useState } from "react";

import type { ListItem } from "@/features/life/repositories/life";

import { ActionButton, useAdminAction, type ActionResult } from "./admin-ui";
import { buttonClass, inputClass } from "./styles";

type Act = (...args: never[]) => Promise<ActionResult>;

export interface ListManagerActions {
  create: (list: string, form: FormData) => Promise<ActionResult>;
  update: (id: string, form: FormData) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
  approve: (id: string) => Promise<ActionResult>;
  tick: (id: string, done: boolean) => Promise<ActionResult>;
  move: (id: string, list: string, direction: number) => Promise<ActionResult>;
}

function rewardText(item: ListItem, couponTitles: Record<string, string>) {
  if (!item.reward) return null;
  if ("kisses" in item.reward) return `🎁 +${item.reward.kisses} 💋`;
  return `🎁 ${couponTitles[item.reward.couponId] ?? item.reward.couponId}`;
}

function ItemForm({
  item,
  submit,
  categories,
  coupons,
  withReward,
  label,
  onDone,
}: {
  item?: ListItem;
  submit: (form: FormData) => Promise<ActionResult>;
  categories?: readonly string[];
  coupons: { id: string; title: string }[];
  withReward: boolean;
  label: string;
  onDone?: () => void;
}) {
  const { pending, run } = useAdminAction();
  const [rewardType, setRewardType] = useState(
    item?.reward ? ("kisses" in item.reward ? "kisses" : "coupon") : "none",
  );
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const element = event.currentTarget;
        run(async () => {
          const result = await submit(form);
          if (result.ok) {
            if (!item) element.reset();
            onDone?.();
          }
          return result;
        });
      }}
    >
      <input
        aria-label="Titolo (in inglese)"
        className={inputClass}
        defaultValue={item?.title}
        maxLength={140}
        name="title"
        placeholder="Titolo (in inglese)"
        required
      />
      <input
        aria-label="Note"
        className={inputClass}
        defaultValue={item?.notes ?? ""}
        maxLength={600}
        name="notes"
        placeholder="Note (facoltative)"
      />
      {categories ? (
        <select
          aria-label="Categoria"
          className={inputClass}
          defaultValue={item?.category ?? categories[0]}
          name="category"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      ) : null}
      {withReward ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            aria-label="Premio della spunta"
            className={inputClass}
            name="rewardType"
            onChange={(event) => setRewardType(event.target.value)}
            value={rewardType}
          >
            <option value="none">Nessun premio</option>
            <option value="kisses">Dà 💋</option>
            <option value="coupon">Sblocca un buono</option>
          </select>
          {rewardType === "kisses" ? (
            <input
              aria-label="Quanti 💋"
              className={inputClass}
              defaultValue={
                item?.reward && "kisses" in item.reward
                  ? item.reward.kisses
                  : 20
              }
              inputMode="numeric"
              max={1000}
              min={1}
              name="kisses"
              type="number"
            />
          ) : rewardType === "coupon" ? (
            <select
              aria-label="Quale buono"
              className={inputClass}
              defaultValue={
                item?.reward && "couponId" in item.reward
                  ? item.reward.couponId
                  : coupons[0]?.id
              }
              name="couponId"
            >
              {coupons.map((coupon) => (
                <option key={coupon.id} value={coupon.id}>
                  {coupon.title}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : label}
      </button>
    </form>
  );
}

/** Add, edit, order, tick, approve and delete list items. */
export function ListManager({
  list,
  items,
  actions,
  categories,
  coupons = [],
  withReward = false,
}: {
  list: "todo" | "suitcase" | "bucket";
  items: ListItem[];
  actions: ListManagerActions;
  categories?: readonly string[];
  coupons?: { id: string; title: string }[];
  withReward?: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const couponTitles = Object.fromEntries(coupons.map((c) => [c.id, c.title]));
  const proposed = items.filter((item) => item.status === "proposed");
  const active = items.filter((item) => item.status === "active");
  const bind =
    <A extends Act>(fn: A, ...args: Parameters<A>) =>
    () =>
      fn(...args);

  return (
    <div className="grid gap-4">
      {proposed.length ? (
        <div className="grid gap-2 rounded-2xl bg-[#fff8e3] p-3">
          <p className="text-sm font-semibold">💡 Proposte di Valentina</p>
          {proposed.map((item) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2"
              key={item.id}
            >
              <span>{item.title}</span>
              <span className="flex gap-2">
                <ActionButton
                  action={bind(actions.approve, item.id)}
                  tone="primary"
                >
                  Approva
                </ActionButton>
                <ActionButton
                  action={bind(actions.remove, item.id)}
                  confirm={{
                    title: "Rifiutare la proposta?",
                    body: `“${item.title}” verrà eliminata.`,
                    confirmLabel: "Rifiuta",
                  }}
                >
                  Rifiuta
                </ActionButton>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <ul className="divide-y divide-[var(--line)]">
        {active.map((item, index) => (
          <li className="grid gap-2 py-3" key={item.id}>
            {editing === item.id ? (
              <ItemForm
                categories={categories}
                coupons={coupons}
                item={item}
                label="Salva"
                onDone={() => setEditing(null)}
                submit={(form) => actions.update(item.id, form)}
                withReward={withReward}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={
                      item.doneAt
                        ? "text-[var(--muted)] line-through"
                        : "font-semibold"
                    }
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {[
                      item.category,
                      rewardText(item, couponTitles),
                      item.doneAt
                        ? `fatto da ${item.doneBy === "valentina" ? "Valentina" : "te"}`
                        : null,
                      item.hasPhoto ? "📸 foto" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ActionButton
                    action={bind(actions.tick, item.id, !item.doneAt)}
                  >
                    {item.doneAt ? "Togli ✓" : "✓"}
                  </ActionButton>
                  <ActionButton action={bind(actions.move, item.id, list, -1)}>
                    ↑
                  </ActionButton>
                  <ActionButton action={bind(actions.move, item.id, list, 1)}>
                    ↓
                  </ActionButton>
                  <button
                    className={buttonClass("ghost")}
                    onClick={() => setEditing(item.id)}
                    type="button"
                  >
                    Modifica
                  </button>
                  <ActionButton
                    action={bind(actions.remove, item.id)}
                    confirm={{
                      title: "Eliminare?",
                      body: `“${item.title}” sparisce dalla lista.`,
                      confirmLabel: "Elimina",
                    }}
                    tone="danger"
                  >
                    Elimina
                  </ActionButton>
                </div>
              </div>
            )}
            <span className="sr-only">Posizione {index + 1}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-3">
        <p className="mb-2 text-sm font-semibold">Aggiungi</p>
        <ItemForm
          categories={categories}
          coupons={coupons}
          label="Aggiungi"
          submit={(form) => actions.create(list, form)}
          withReward={withReward}
        />
      </div>
    </div>
  );
}
