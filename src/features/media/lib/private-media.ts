import "server-only";

import manifest from "@/data/private-media-manifest.json";
import { getSupabaseServerContext } from "@/lib/supabase/server";

const BUCKET_CHECK_MS = 5 * 60_000;
let bucketVerifiedAt = 0;

export const PRIVATE_PHOTO_BUCKET = "vg-private-photos";
const objects = new Map(manifest.map((entry) => [entry.id, entry.object]));
export function privateMediaObject(id: string): string | undefined {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? objects.get(id) : undefined;
}

export async function loadPrivateMedia(object: string): Promise<Blob> {
  if (![...objects.values()].includes(object))
    throw new Error("Unknown private media");
  const { client } = getSupabaseServerContext();
  // The bucket must be private. The (successful) check is remembered for a
  // few minutes, so a gallery of 25 photos makes 25 calls, not 50.
  if (Date.now() - bucketVerifiedAt > BUCKET_CHECK_MS) {
    const { data: bucket, error: bucketError } =
      await client.storage.getBucket(PRIVATE_PHOTO_BUCKET);
    if (bucketError || !bucket || bucket.public) {
      bucketVerifiedAt = 0;
      throw new Error("Private photo storage unavailable");
    }
    bucketVerifiedAt = Date.now();
  }
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
