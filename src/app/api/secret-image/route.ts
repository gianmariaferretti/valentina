import { hasValidAccessSession } from "@/lib/auth/session";
import {
  readArchiveProof,
  writeArchiveProof,
} from "@/features/secret/lib/archive-session";
import { loadPrivateArchiveImage } from "@/features/secret/lib/private-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  Vary: "Cookie",
};

export async function GET(request: Request): Promise<Response> {
  if (!(await hasValidAccessSession()))
    return new Response("Unauthorized", { status: 401, headers });
  const proof = await readArchiveProof();
  if (
    !proof ||
    !proof.ageConfirmed ||
    !["photo-reveal", "final-reveal"].includes(proof.stage) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response("Restricted", { status: 403, headers });
  try {
    const image = await loadPrivateArchiveImage();
    if (proof.stage === "photo-reveal" && proof.imageServedAt === null)
      await writeArchiveProof({ ...proof, imageServedAt: Date.now() });
    return new Response(image, {
      headers: { ...headers, "Content-Type": image.type },
    });
  } catch {
    return new Response("Private image temporarily unavailable.", {
      status: 503,
      headers,
    });
  }
}
