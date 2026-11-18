import { handleDoodleFile } from "@/features/doodles/server/handlers";
import { hasValidAccessSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A doodle's preview or scene, with Valentina's session only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; kind: string }> },
): Promise<Response> {
  if (!(await hasValidAccessSession()))
    return new Response("Unauthorized", { status: 401 });
  const { id, kind } = await context.params;
  return handleDoodleFile(request, id, kind);
}
