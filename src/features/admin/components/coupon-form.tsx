"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  couponCategories,
  couponRarities,
  couponSettings,
} from "@/features/coupons/types";

import type { ActionResult } from "./admin-ui";
import { buttonClass, Field, inputClass } from "./admin-ui";

export interface CouponFormValues {
  title: string;
  shortDescription: string;
  description: string;
  setting: string;
  rarity: string;
  category: string;
  unlock: string;
  unlockCondition: string;
  terms: string;
  quantity: number;
}

const labels: Record<string, string> = {
  together: "Together (di persona)",
  apart: "Apart (a distanza)",
  standard: "Standard",
  premium: "Premium",
  legendary: "Legendary",
  impossible: "Impossible",
  dates: "Appuntamenti",
  food: "Cibo",
  romantic: "Romantico",
  emergency: "Emergenza",
  available: "Subito disponibile",
  locked: "Bloccato (lo sblocchi tu)",
  secret: "Segreto (nascosto finché non lo sblocchi)",
};

export function CouponForm({
  initial,
  submit,
  isNew,
}: {
  initial: CouponFormValues;
  submit: (form: FormData) => Promise<ActionResult>;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const select = (name: keyof CouponFormValues, options: readonly string[]) => (
    <select
      className={inputClass}
      defaultValue={String(initial[name])}
      name={name}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option] ?? option}
        </option>
      ))}
    </select>
  );

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await submit(form).catch(() => ({
            ok: false,
            message: "Connessione persa. Riprova.",
          }));
          if (result.ok) {
            toast.success(result.message);
            router.push("/admin/buoni");
            router.refresh();
          } else toast.error(result.message);
        });
      }}
    >
      <Field label="Titolo">
        <input
          className={inputClass}
          defaultValue={initial.title}
          maxLength={80}
          name="title"
          required
        />
      </Field>
      <Field
        hint="La riga che si vede nel portafoglio."
        label="Descrizione breve"
      >
        <input
          className={inputClass}
          defaultValue={initial.shortDescription}
          maxLength={220}
          name="shortDescription"
          required
        />
      </Field>
      <Field
        hint="Il testo completo nella pagina del buono."
        label="Descrizione"
      >
        <textarea
          className={`${inputClass} min-h-28`}
          defaultValue={initial.description}
          maxLength={1200}
          name="description"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Sezione">{select("setting", couponSettings)}</Field>
        <Field label="Rarità">{select("rarity", couponRarities)}</Field>
        <Field label="Categoria">{select("category", couponCategories)}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sblocco">
          {select("unlock", ["available", "locked", "secret"])}
        </Field>
        <Field
          hint="Facoltativo: cosa deve succedere per sbloccarlo."
          label="Condizione di sblocco"
        >
          <input
            className={inputClass}
            defaultValue={initial.unlockCondition}
            maxLength={160}
            name="unlockCondition"
          />
        </Field>
      </div>
      <Field
        hint="Una regola per riga. Vuoto = regole standard."
        label="Regole"
      >
        <textarea
          className={`${inputClass} min-h-24`}
          defaultValue={initial.terms}
          name="terms"
        />
      </Field>
      {isNew ? (
        <Field hint="Quante copie uguali (da 1 a 10)." label="Quantità">
          <input
            className={inputClass}
            defaultValue={initial.quantity}
            inputMode="numeric"
            max={10}
            min={1}
            name="quantity"
            type="number"
          />
        </Field>
      ) : null}
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : isNew ? "Crea buono" : "Salva modifiche"}
      </button>
    </form>
  );
}
