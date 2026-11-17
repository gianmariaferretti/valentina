import { PRIVATE_PHOTO_BUCKET } from "@/features/media/lib/private-media";
import { loadPhotoObject } from "@/features/life/repositories/life";
import { hasValidAccessSession } from "@/lib/auth/session";
import { getSupabaseServerContext } from "@/lib/supabase/server";

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

/** A bucket-list photo: private bucket, session only, never cached. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!(await hasValidAccessSession()))
    return new Response("Unauthorized", { status: 401, headers });
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Restricted", { status: 403, headers });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(id))
    return new Response("Not found", { status: 404, headers });
  try {
    const object = await loadPhotoObject(id);
    if (!object) return new Response("Not found", { status: 404, headers });
    const { client } = getSupabaseServerContext();
    const { data, error } = await client.storage
      .from(PRIVATE_PHOTO_BUCKET)
      .download(object);
    if (error || !data || data.size > 2_600_000)
      return new Response("Unavailable", { status: 503, headers });
    return new Response(data, {
      headers: {
        ...headers,
        "Content-Type": object.endsWith(".webp") ? "image/webp" : "image/jpeg",
      },
    });
  } catch {
    return new Response("Unavailable", { status: 503, headers });
  }
}
