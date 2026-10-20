import type { Metadata } from "next";

import { loadB1PilotDraft } from "@/features/italian-corner/laboratory/b1-exam-actions";
import { publicB1Exam } from "@/features/italian-corner/laboratory/b1-exam-store";
import { B1Exam } from "@/features/italian-corner/laboratory/b1-exam";

export const metadata: Metadata = {
  title: "Prova B1 · La Dolce Lingua",
  robots: { index: false, follow: false },
};

export default async function B1PilotPage() {
  const initial = await loadB1PilotDraft();
  return <B1Exam exam={publicB1Exam()} initial={initial} />;
}
