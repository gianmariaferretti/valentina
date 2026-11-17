import type { Metadata } from "next";

import { ConfirmAction } from "@/features/notifications/components/confirm-action";
import { peekActionToken } from "@/features/notifications/repositories/action-tokens";

export const metadata: Metadata = {
  title: "Conferma",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * The page a button in an email opens. Opening it changes nothing (mail
 * apps prefetch links to scan them): only the button below does.
 */
export default async function EmailActionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const action = await peekActionToken(decodeURIComponent(token)).catch(
    () => null,
  );

  return (
    <main
      className="mx-auto grid min-h-svh max-w-md content-center gap-5 px-5 py-10"
      lang="it"
    >
      <p className="text-xs font-bold tracking-[0.18em] text-[var(--rust)] uppercase">
        V + G
      </p>
      {action === null ? (
        <>
          <h1 className="font-display text-4xl">Link non valido</h1>
          <p className="text-[var(--muted)]">
            È scaduto (dopo 7 giorni) oppure non è un link del sito. Puoi fare
            la stessa cosa dal pannello.
          </p>
        </>
      ) : action === "used" ? (
        <>
          <h1 className="font-display text-4xl">Già fatto</h1>
          <p className="text-[var(--muted)]">
            Questo link è già stato usato: vale una volta sola.
          </p>
        </>
      ) : action.action === "deliver" ? (
        <>
          <h1 className="font-display text-4xl">Consegnato?</h1>
          <p className="text-[var(--muted)]">
            Segna{" "}
            <strong className="text-[var(--ink)]">
              {action.payload.title}
            </strong>{" "}
            come consegnato nel pannello.
          </p>
          <ConfirmAction label="✅ Sì, consegnato" token={token} />
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl">Mandarle un cuore?</h1>
          <p className="text-[var(--muted)]">
            Valentina vedrà un grande cuore sul sito, appena lo apre. Per
            aggiungere un messaggio usa il pannello.
          </p>
          <ConfirmAction label="❤️ Manda il cuore" token={token} />
        </>
      )}
    </main>
  );
}
