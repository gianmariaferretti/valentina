"use client";

import { useAdminAction, type ActionResult } from "./admin-ui";
import { buttonClass, inputClass } from "./styles";

export function NotificationSettingsForm({
  initial,
  save,
}: {
  initial: {
    couponRedeemed: boolean;
    missYou: boolean;
    digest: boolean;
    callLink: string;
  };
  save: (form: FormData) => Promise<ActionResult>;
}) {
  const { pending, run } = useAdminAction();
  const toggle = (name: keyof typeof initial, label: string, hint: string) => (
    <label className="flex min-h-11 items-start gap-3">
      <input
        className="mt-1 size-5 shrink-0"
        defaultChecked={Boolean(initial[name])}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-xs text-[var(--muted)]">{hint}</span>
      </span>
    </label>
  );
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => save(form));
      }}
    >
      {toggle(
        "couponRedeemed",
        "Buono usato",
        "Un'email ogni volta che usa un buono, con “✅ Consegnato”.",
      )}
      {toggle(
        "missYou",
        "Miss you",
        "Al massimo un'email ogni 10 minuti; i tocchi in più si sommano.",
      )}
      {toggle(
        "digest",
        "Riepilogo serale",
        "Un'email alla sera con cosa ha fatto durante il giorno.",
      )}
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Link per “📞 Call her”</span>
        <input
          className={inputClass}
          defaultValue={initial.callLink}
          inputMode="url"
          name="callLink"
          placeholder="tel:+57… oppure https://wa.me/57…"
        />
        <span className="text-xs text-[var(--muted)]">
          Vuoto = niente pulsante nell&apos;email.
        </span>
      </label>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : "Salva"}
      </button>
    </form>
  );
}

export function HeartForm({
  send,
}: {
  send: (form: FormData) => Promise<ActionResult>;
}) {
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const element = event.currentTarget;
        run(async () => {
          const result = await send(form);
          if (result.ok) element.reset();
          return result;
        });
      }}
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">
          Messaggio breve (facoltativo, in inglese)
        </span>
        <input
          className={inputClass}
          maxLength={140}
          name="message"
          placeholder="Thinking of you."
        />
      </label>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Invio…" : "❤️ Manda un cuore"}
      </button>
    </form>
  );
}
