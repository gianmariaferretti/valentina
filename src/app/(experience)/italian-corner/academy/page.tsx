import { redirect } from "next/navigation";

// Existing links remain valid; the original 80-lesson Academy is canonical.
export default function AcademyPage() {
  redirect("/la-dolce-lingua");
}
