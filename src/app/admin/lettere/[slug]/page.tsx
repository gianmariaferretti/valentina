import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { openWhenLetters } from "@/data/open-when";
import {
  restoreOriginalLetter,
  saveLetter,
} from "@/features/admin/actions/letters";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { LetterForm } from "@/features/admin/components/letter-form";
import { loadAllLetters } from "@/features/admin/repositories/content";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Modifica lettera" };

export default async function EditLetterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSession();
  const { slug } = await params;
  const letter = (await loadAllLetters()).find((item) => item.slug === slug);
  if (!letter) notFound();
  const fromCode = openWhenLetters.some((item) => item.slug === slug);
  return (
    <div className="max-w-2xl">
      <SectionHeader
        actions={
          fromCode ? (
            <ActionButton
              action={restoreOriginalLetter.bind(null, slug)}
              confirm={{
                title: "Tornare all'originale?",
                body: "Le modifiche fatte qui vengono cancellate.",
                confirmLabel: "Ripristina",
              }}
            >
              Ripristina originale
            </ActionButton>
          ) : null
        }
        title={`Open when ${letter.title.toLowerCase()}`}
      />
      <Card>
        <LetterForm
          initial={{
            title: letter.title,
            preview: letter.preview,
            salutation: letter.salutation,
            paragraphs: letter.paragraphs.join("\n\n"),
            signoff: letter.signoff,
            postscript: letter.postscript ?? "",
            annotation: letter.annotation,
            mood: letter.mood,
            tone: letter.envelope.tone,
            mark: letter.envelope.mark,
          }}
          isNew={false}
          submit={saveLetter.bind(null, slug)}
        />
      </Card>
    </div>
  );
}
