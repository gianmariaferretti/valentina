import { handleDoodleUpload } from "@/features/doodles/server/handlers";
import { hasValidAccessSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Valentina sends a doodle to Gianmaria. */
export async function POST(request: Request): Promise<Response> {
  if (!(await hasValidAccessSession()))
    return Response.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  return handleDoodleUpload(request, "valentina");
}
