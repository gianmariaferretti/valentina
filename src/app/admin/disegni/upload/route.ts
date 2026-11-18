import { handleDoodleUpload } from "@/features/doodles/server/handlers";
import { readAdminSession } from "@/lib/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gianmaria draws back, from the panel (the admin cookie lives on /admin). */
export async function POST(request: Request): Promise<Response> {
  if (!(await readAdminSession()))
    return Response.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  return handleDoodleUpload(request, "gianmaria");
}
