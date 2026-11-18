import { handleDoodleFile } from "@/features/doodles/server/handlers";
import { readAdminSession } from "@/lib/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A doodle's preview or scene for the panel. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; kind: string }> },
): Promise<Response> {
  if (!(await readAdminSession()))
    return new Response("Unauthorized", { status: 401 });
  const { id, kind } = await context.params;
  return handleDoodleFile(request, id, kind);
}
