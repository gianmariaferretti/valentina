import { permanentRedirect } from "next/navigation";
import { requireAccessSession } from "@/lib/auth/session";

export default async function LegacyGianmariaExamPage(): Promise<never> {
  await requireAccessSession();
  permanentRedirect("/quiz");
}
