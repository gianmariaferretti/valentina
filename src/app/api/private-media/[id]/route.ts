import { hasValidAccessSession } from "@/lib/auth/session";
import {
  loadPrivateMedia,
  privateMediaObject,
} from "@/features/media/lib/private-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!(await hasValidAccessSession()))
    return new Response("Unauthorized", { status: 401, headers });
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Restricted", { status: 403, headers });
  const object = privateMediaObject((await context.params).id);
  if (!object) return new Response("Not found", { status: 404, headers });
  try {
    const image = await loadPrivateMedia(object);
    return new Response(image, {
      headers: { ...headers, "Content-Type": "image/webp" },
    });
  } catch {
    return new Response("Private photograph temporarily unavailable", {
      status: 503,
      headers,
    });
  }
}
