import "server-only";

import manifest from "@/data/private-media-manifest.json";
import { getSupabaseServerContext } from "@/lib/supabase/server";

export const PRIVATE_PHOTO_BUCKET = "vg-private-photos";
const objects = new Map(manifest.map((entry) => [entry.id, entry.object]));
export function privateMediaObject(id: string): string | undefined {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? objects.get(id) : undefined;
}

export async function loadPrivateMedia(object: string): Promise<Blob> {
  if (![...objects.values()].includes(object))
    throw new Error("Unknown private media");
  const { client } = getSupabaseServerContext();
  const { data: bucket, error: bucketError } =
    await client.storage.getBucket(PRIVATE_PHOTO_BUCKET);
  if (bucketError || !bucket || bucket.public)
    throw new Error("Private photo storage unavailable");
  const { data, error } = await client.storage
    .from(PRIVATE_PHOTO_BUCKET)
    .download(object);
  if (
    error ||
    !data ||
    data.type !== "image/webp" ||
    data.size > 2_000_000 ||
    !data.size
  )
    throw new Error("Private photograph unavailable");
  return data;
}
