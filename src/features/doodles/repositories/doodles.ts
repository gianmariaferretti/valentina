import "server-only";

import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  DOODLE_BUCKET,
  doodleObjects,
  isDoodleId,
  sortDoodles,
  type Doodle,
  type DoodleAuthor,
} from "../lib/doodles";

/**
 * Doodles in Supabase: the row in public.doodles, the scene and the PNG in
 * the private bucket. Until the migration is applied every read returns
 * "not ready" instead of breaking the page.
 */

export class DoodlesNotReady extends Error {
  constructor() {
    super("Doodles are not set up yet.");
  }
}

interface Row {
  id: string;
  author: DoodleAuthor;
  title: string | null;
  reply_to: string | null;
  favorite: boolean;
  created_at: string;
}

const COLUMNS = "id, author, title, reply_to, favorite, created_at";

// The generated database types do not know the table until the migration
// is applied; this keeps the queries typed by hand.
type Table = {
  select: (columns: string) => {
    order: (
      column: string,
      options: { ascending: boolean },
    ) => {
      limit: (n: number) => Promise<{ data: Row[] | null; error: unknown }>;
    };
    eq: (
      column: string,
      value: string,
    ) => {
      maybeSingle: () => Promise<{ data: Row | null; error: unknown }>;
    };
  };
  insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
};

function table(): Table {
  const { client } = getSupabaseServerContext();
  return (client as unknown as { from: (name: string) => Table }).from(
    "doodles",
  );
}

/** Missing table (migration not applied yet), as PostgREST reports it. */
function missing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "PGRST205" || code === "42P01";
}

function check(error: unknown) {
  if (!error) return;
  if (missing(error)) throw new DoodlesNotReady();
  throw error instanceof Error
    ? error
    : new Error(String((error as { message?: string }).message ?? error));
}

const toDoodle = (row: Row): Doodle => ({
  id: row.id,
  author: row.author,
  title: row.title,
  replyTo: row.reply_to,
  favorite: row.favorite,
  createdAt: row.created_at,
});

export async function listDoodles(limit = 120): Promise<Doodle[]> {
  const { data, error } = await table()
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  check(error);
  return sortDoodles((data ?? []).map(toDoodle));
}

export async function getDoodle(id: string): Promise<Doodle | null> {
  if (!isDoodleId(id)) return null;
  const { data, error } = await table()
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  check(error);
  return data ? toDoodle(data) : null;
}

/** Uploads the scene and the preview, then records the doodle. */
export async function saveDoodle(input: {
  author: DoodleAuthor;
  scene: string;
  preview: Uint8Array;
  replyTo: string | null;
  title: string | null;
}): Promise<Doodle> {
  const id = crypto.randomUUID();
  const objects = doodleObjects(id);
  const { client } = getSupabaseServerContext();
  const storage = client.storage.from(DOODLE_BUCKET);
  const scene = await storage.upload(objects.scene, input.scene, {
    contentType: "application/json",
    upsert: false,
  });
  if (scene.error) throw new DoodlesNotReady();
  const preview = await storage.upload(objects.preview, input.preview, {
    contentType: "image/png",
    upsert: false,
  });
  if (preview.error) {
    await storage.remove([objects.scene]).catch(() => undefined);
    throw new DoodlesNotReady();
  }
  const replyTo =
    input.replyTo && (await getDoodle(input.replyTo)) ? input.replyTo : null;
  const { error } = await table().insert({
    id,
    author: input.author,
    title: input.title,
    reply_to: replyTo,
    scene_object: objects.scene,
    preview_object: objects.preview,
  });
  if (error) {
    await storage
      .remove([objects.scene, objects.preview])
      .catch(() => undefined);
    check(error);
  }
  return {
    id,
    author: input.author,
    title: input.title,
    replyTo,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
}

/** The scene (JSON) or preview (PNG) of an existing doodle. */
export async function loadDoodleFile(
  id: string,
  kind: "scene" | "preview",
): Promise<Blob | null> {
  if (!(await getDoodle(id))) return null;
  const { client } = getSupabaseServerContext();
  const { data, error } = await client.storage
    .from(DOODLE_BUCKET)
    .download(doodleObjects(id)[kind]);
  if (error || !data) return null;
  return data;
}

export async function setDoodleFavorite(id: string, favorite: boolean) {
  if (!isDoodleId(id)) throw new Error("Invalid doodle id.");
  const { error } = await table().update({ favorite }).eq("id", id);
  check(error);
}

export async function deleteDoodle(id: string) {
  if (!isDoodleId(id)) throw new Error("Invalid doodle id.");
  const { error } = await table().delete().eq("id", id);
  check(error);
  const { client } = getSupabaseServerContext();
  const objects = doodleObjects(id);
  await client.storage
    .from(DOODLE_BUCKET)
    .remove([objects.scene, objects.preview])
    .catch(() => undefined);
}
