import "server-only";

import {
  loadKissAmounts,
  creditSiteKisses,
} from "@/features/kisses/repositories/kisses";
import { notifyDoodle } from "@/features/notifications/notify";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import {
  checkScene,
  isDoodleId,
  isPng,
  MAX_PREVIEW_BYTES,
  MAX_SCENE_BYTES,
  type DoodleAuthor,
} from "../lib/doodles";
import {
  DoodlesNotReady,
  loadDoodleFile,
  saveDoodle,
} from "../repositories/doodles";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });

/** Only the site itself may post a doodle (no cross-site forms). */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return site === "same-origin";
  return origin === new URL(request.url).origin;
}

/**
 * A doodle sent from the editor: multipart with the scene JSON and a PNG
 * preview. The caller has already checked who is drawing.
 */
export async function handleDoodleUpload(
  request: Request,
  author: DoodleAuthor,
): Promise<Response> {
  if (!sameOrigin(request))
    return json({ ok: false, message: "Not allowed." }, 403);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_SCENE_BYTES + MAX_PREVIEW_BYTES + 50_000)
    return json({ ok: false, message: "The drawing is too big." }, 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: "The drawing could not be read." }, 400);
  }
  const scene = checkScene(String(form.get("scene") ?? ""));
  if (!scene.ok) return json({ ok: false, message: scene.reason }, 400);
  const preview = form.get("preview");
  if (!(preview instanceof Blob) || preview.size > MAX_PREVIEW_BYTES)
    return json({ ok: false, message: "The preview is missing." }, 400);
  const bytes = new Uint8Array(await preview.arrayBuffer());
  if (!isPng(bytes))
    return json({ ok: false, message: "The preview is not a PNG." }, 400);
  const replyTo = form.get("replyTo");
  const title =
    String(form.get("title") ?? "")
      .trim()
      .slice(0, 80) || null;

  try {
    const doodle = await saveDoodle({
      author,
      scene: scene.json,
      preview: bytes,
      replyTo: isDoodleId(replyTo) ? replyTo : null,
      title,
    });
    let kisses = 0;
    if (author === "valentina") {
      // Email Gianmaria; the first doodle ever also pays into the casino.
      await notifyDoodle(doodle.id);
      try {
        const amounts = await loadKissAmounts();
        if (amounts.firstDoodle > 0) {
          const paid = await creditSiteKisses({
            key: "doodle:first",
            amount: amounts.firstDoodle,
            label: "Your first doodle for Gianmaria",
          });
          if (paid !== null) kisses = amounts.firstDoodle;
        }
      } catch (error) {
        reportPersistenceFailure("credit first doodle", error);
      }
    }
    return json({ ok: true, doodle, kisses });
  } catch (error) {
    if (error instanceof DoodlesNotReady)
      return json(
        {
          ok: false,
          message:
            "The doodle album isn't ready yet. Gianmaria has to finish setting it up.",
        },
        503,
      );
    reportPersistenceFailure("save doodle", error);
    return json({ ok: false, message: "Couldn't send it. Try again?" }, 500);
  }
}

/** The PNG preview or the scene JSON, private, never cached. */
export async function handleDoodleFile(
  request: Request,
  id: string,
  kind: string,
): Promise<Response> {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Restricted", { status: 403, headers });
  if (!isDoodleId(id) || (kind !== "preview" && kind !== "scene"))
    return new Response("Not found", { status: 404, headers });
  try {
    const file = await loadDoodleFile(id, kind);
    if (!file) return new Response("Not found", { status: 404, headers });
    return new Response(file, {
      headers: {
        ...headers,
        "Content-Type": kind === "preview" ? "image/png" : "application/json",
      },
    });
  } catch {
    return new Response("Unavailable", { status: 503, headers });
  }
}
