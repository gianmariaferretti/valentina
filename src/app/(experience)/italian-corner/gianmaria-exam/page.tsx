import { permanentRedirect } from "next/navigation";

export default function LegacyGianmariaExamPage(): never {
  permanentRedirect("/quiz");
}
