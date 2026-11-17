import type { Metadata } from "next";

import { createLetter } from "@/features/admin/actions/letters";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { LetterForm } from "@/features/admin/components/letter-form";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Nuova lettera" };

export default async function NewLetterPage() {
  await requireAdminSession();
  return (
    <div className="max-w-2xl">
      <SectionHeader
        subtitle="Il testo per Valentina in inglese."
        title="Nuova lettera"
      />
      <Card>
        <LetterForm
          initial={{
            title: "",
            preview: "",
            salutation: "My love,",
            paragraphs: "",
            signoff: "Yours, G.",
            postscript: "",
            annotation: "",
            mood: "tender",
            tone: "ivory",
            mark: "kiss",
          }}
          isNew
          submit={createLetter}
        />
      </Card>
    </div>
  );
}
