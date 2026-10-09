import "server-only";
import { getSupabaseServerContext } from "@/lib/supabase/server";

/** Non-sensitive original illustration. Never replace this source with personal media. */
const illustration = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
<defs><radialGradient id="glow"><stop stop-color="#753544"/><stop offset="1" stop-color="#160e13"/></radialGradient></defs>
<rect width="1200" height="1500" fill="url(#glow)"/>
<rect x="65" y="65" width="1070" height="1370" fill="none" stroke="#b39a80" opacity=".5"/>
<path d="M320 510 Q600 340 880 510 L880 1050 Q600 1220 320 1050Z" fill="#25151b" stroke="#ad8676"/>
<path d="M320 510 L600 760 L880 510 M320 1050 L600 760 L880 1050" fill="none" stroke="#ad8676"/>
<circle cx="600" cy="760" r="100" fill="#702d3d" stroke="#cfa894"/>
<text x="600" y="787" text-anchor="middle" fill="#f2e6d6" font-family="Georgia,serif" font-size="72">V+G</text>
<text x="600" y="280" text-anchor="middle" fill="#f2e6d6" font-family="Georgia,serif" font-size="45">For your eyes only.</text>
<text x="600" y="1290" text-anchor="middle" fill="#c4a799" font-family="sans-serif" font-size="22" letter-spacing="5">ILLUSTRATION · PHOTOGRAPH TO FOLLOW</text>
</svg>`;

export async function loadPrivateArchiveImage(): Promise<Blob> {
  const bucket = process.env.SPICY_ARCHIVE_BUCKET;
  const object = process.env.SPICY_ARCHIVE_OBJECT;
  if (!bucket && !object)
    return new Blob([illustration], { type: "image/svg+xml" });
  if (!bucket || !object)
    throw new Error("Incomplete archive image configuration.");
  const { client } = getSupabaseServerContext();
  const bucketResult = await client.storage.getBucket(bucket);
  // Fail closed: a public bucket must never become the archive's image source.
  if (bucketResult.error || !bucketResult.data || bucketResult.data.public)
    throw new Error("Archive storage must be private.");
  const { data, error } = await client.storage.from(bucket).download(object);
  if (
    error ||
    !data ||
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      data.type,
    ) ||
    data.size > 12 * 1024 * 1024
  )
    throw new Error("Archive image unavailable.");
  return data;
}
