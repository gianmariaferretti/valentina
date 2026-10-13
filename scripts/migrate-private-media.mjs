/** Explicit, idempotent private-photo migration. Never changes user-state tables.
 * Load secrets via Node --env-file, never command-line arguments or console output.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import manifest from "../src/data/private-media-manifest.json" with { type: "json" };

const bucketId = "vg-private-photos";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const args = new Set(process.argv.slice(2));
if (
  [...args].some(
    (arg) =>
      !["--apply", "--verify-site", "--archive-public-sources"].includes(arg),
  )
)
  throw new Error("Unknown migration option");
const apply = args.has("--apply");
const verifySite = args.has("--verify-site");
const archive = args.has("--archive-public-sources");
if (archive && (!apply || !verifySite))
  throw new Error(
    "Source archival requires upload and complete site verification",
  );
const photos = await Promise.all(
  manifest.map(async (entry) => {
    let bytes;
    try {
      bytes = await readFile(entry.source);
    } catch {
      bytes = await readFile(
        ".private-media-source-backup/" + entry.id + ".webp",
      );
    }
    if (
      bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP"
    )
      throw new Error("Invalid source photograph");
    return { ...entry, bytes, sha256: hash(bytes) };
  }),
);
if (!apply) {
  console.log(
    JSON.stringify({
      mode: "read-only plan",
      bucket: bucketId,
      count: photos.length,
      bytes: photos.reduce((sum, p) => sum + p.bytes.length, 0),
    }),
  );
} else {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Missing server-only SUPABASE_URL / SUPABASE_SECRET_KEY");
  if (new URL(url).origin !== "https://rkjcvcivxhdscudxeaqp.supabase.co")
    throw new Error("Refusing an unapproved Supabase project");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buckets, error: listError } =
    await client.storage.listBuckets();
  if (listError) throw new Error("Storage authorization unavailable");
  const existing = buckets.find((bucket) => bucket.id === bucketId);
  if (existing?.public)
    throw new Error("Refusing a public bucket; investigate before proceeding");
  if (!existing) {
    const { error } = await client.storage.createBucket(bucketId, {
      public: false,
      allowedMimeTypes: ["image/webp"],
      fileSizeLimit: 2_000_000,
    });
    if (error) throw new Error("Could not create the approved private bucket");
  }
  const { data: bucket, error: bucketError } =
    await client.storage.getBucket(bucketId);
  if (bucketError || bucket?.public !== false)
    throw new Error("Bucket privacy verification failed");
  const site = verifySite ? process.env.VG_MIGRATION_SITE_URL : null;
  const session = verifySite ? process.env.VG_MIGRATION_SESSION : null;
  if (verifySite && (!site || !session))
    throw new Error(
      "Site verification requires VG_MIGRATION_SITE_URL and an existing signed VG_MIGRATION_SESSION cookie value",
    );
  if (site && !["https:", "http:"].includes(new URL(site).protocol))
    throw new Error("Invalid verification site");
  if (
    site &&
    new URL(site).protocol === "http:" &&
    !["localhost", "127.0.0.1"].includes(new URL(site).hostname)
  )
    throw new Error("Session cookies require HTTPS outside loopback");
  for (const photo of photos) {
    const storage = client.storage.from(bucketId);
    const { data: before, error: readError } = await storage.download(
      photo.object,
    );
    if (!readError && before) {
      if (hash(Buffer.from(await before.arrayBuffer())) !== photo.sha256)
        throw new Error(
          "Existing object differs; refusing to overwrite " + photo.id,
        );
    } else {
      const { error } = await storage.upload(photo.object, photo.bytes, {
        contentType: "image/webp",
        cacheControl: "0",
        upsert: false,
      });
      if (error) throw new Error("Upload failed for " + photo.id);
    }
    const { data, error } = await storage.download(photo.object);
    if (
      error ||
      !data ||
      hash(Buffer.from(await data.arrayBuffer())) !== photo.sha256
    )
      throw new Error("Private integrity check failed for " + photo.id);
    for (const access of ["public", "authenticated"]) {
      const response = await fetch(
        `${url}/storage/v1/object/${access}/${bucketId}/${photo.object}`,
        { redirect: "error", cache: "no-store" },
      );
      if (response.ok)
        throw new Error("Anonymous access succeeded for " + photo.id);
    }
    if (site) {
      const endpoint = new URL("/api/private-media/" + photo.id, site);
      const anonymous = await fetch(endpoint, {
        redirect: "error",
        cache: "no-store",
      });
      if (anonymous.status !== 401)
        throw new Error("Site did not reject anonymous media access");
      const authenticated = await fetch(endpoint, {
        headers: { Cookie: `vg_access=${session}` },
        redirect: "error",
        cache: "no-store",
      });
      if (
        !authenticated.ok ||
        authenticated.headers.get("cache-control") !==
          "private, no-store, max-age=0" ||
        hash(Buffer.from(await authenticated.arrayBuffer())) !== photo.sha256
      )
        throw new Error("Authenticated site delivery failed for " + photo.id);
    }
    console.log("Verified private copy: " + photo.id);
  }
  await writeFile(
    ".private-media-receipt.json",
    JSON.stringify(
      {
        bucket: bucketId,
        verifiedAt: new Date().toISOString(),
        siteVerified: verifySite,
        photos: photos.map(({ id, object, sha256 }) => ({
          id,
          object,
          sha256,
        })),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  // Only after ALL copies, anonymous denial and signed-cookie site delivery pass.
  // Preserve originals recoverably outside public/, never delete them.
  if (archive) {
    await mkdir(".private-media-source-backup", {
      recursive: true,
      mode: 0o700,
    });
    for (const photo of photos) {
      try {
        await rename(
          photo.source,
          ".private-media-source-backup/" + photo.id + ".webp",
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    console.log(
      "26 originals moved recoverably outside public/. Historical Git/deployments remain unchanged.",
    );
  }
}
