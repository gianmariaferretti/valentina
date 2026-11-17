import { redirect } from "next/navigation";
import { requireAccessSession } from "@/lib/auth/session";

// Existing links remain valid; the original 80-lesson Academy is canonical.
export default async function AcademyPage() {
  await requireAccessSession();
  redirect("/la-dolce-lingua");
}
