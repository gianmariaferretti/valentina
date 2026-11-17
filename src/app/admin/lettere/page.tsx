import type { Metadata } from "next";
import Link from "next/link";

import { setLetterHidden } from "@/features/admin/actions/letters";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { buttonClass } from "@/features/admin/components/styles";
import {
  Card,
  formatWhen,
  Pill,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import { loadAdminLetters } from "@/features/admin/repositories/admin-data";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Lettere" };

export default async function AdminLettersPage() {
  await requireAdminSession();
  let letters;
  try {
    letters = await loadAdminLetters();
  } catch {
    return (
      <>
        <SectionHeader title="Lettere" />
        <Unavailable />
      </>
    );
  }
  const opened = letters.filter((letter) => letter.openedAt).length;
  return (
    <div>
      <SectionHeader
        actions={
          <Link className={buttonClass("primary")} href="/admin/lettere/nuova">
            + Nuova lettera
          </Link>
        }
        subtitle={`${opened} di ${letters.length} aperte`}
        title="Lettere open-when"
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {letters.map((letter) => (
          <li key={letter.slug}>
            <Card className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    Open when {letter.title.toLowerCase()}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {letter.preview}
                  </p>
                  <p className="mt-1 text-xs">
                    {letter.openedAt
                      ? `Aperta il ${formatWhen(letter.openedAt)}`
                      : "Non ancora aperta"}
                    {letter.custom ? " · scritta da qui" : ""}
                  </p>
                </div>
                {letter.hidden ? (
                  <Pill tone="bad">Nascosta</Pill>
                ) : letter.openedAt ? (
                  <Pill tone="good">Aperta</Pill>
                ) : (
                  <Pill>Chiusa</Pill>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={buttonClass("ghost")}
                  href={`/admin/lettere/${letter.slug}`}
                >
                  Modifica
                </Link>
                <ActionButton
                  action={setLetterHidden.bind(
                    null,
                    letter.slug,
                    !letter.hidden,
                  )}
                  undo={setLetterHidden.bind(null, letter.slug, letter.hidden)}
                >
                  {letter.hidden ? "👀 Mostra" : "🙈 Nascondi"}
                </ActionButton>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
