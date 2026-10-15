import { hasValidAccessSession } from "@/lib/auth/session";
import { createContractPdf } from "@/features/relationship-contract/lib/pdf";
import { loadContract } from "@/features/relationship-contract/lib/repository";

export async function GET() {
  if (!(await hasValidAccessSession()))
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  try {
    const { document, state } = await loadContract();
    if (state.loadFailed)
      return new Response("The private archive is temporarily unavailable.", {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      });
    const pdf = await createContractPdf(document, state);
    const label = state.status === "fully_executed" ? "signed" : "unsigned";
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="VG-2026-001-${label}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("The certificate could not be generated.", {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
