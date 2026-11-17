import { hasValidAccessSession } from "@/lib/auth/session";
import { getSupabaseServerContext } from "@/lib/supabase/server";

const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Vary: "Cookie",
};

/** The oldest heart Valentina hasn't seen yet (polled every 30 s). */
export async function GET() {
  if (!(await hasValidAccessSession()))
    return Response.json({ heart: null }, { status: 401, headers: noStore });
  try {
    const { client } = getSupabaseServerContext();
    const { data } = await client
      .from("hearts")
      .select("id, message, created_at")
      .is("seen_at", null)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    return Response.json({ heart: data ?? null }, { headers: noStore });
  } catch {
    return Response.json({ heart: null }, { headers: noStore });
  }
}
