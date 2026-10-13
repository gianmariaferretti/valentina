/**
 * Explicitly isolated QA fixture, not a production backend.
 * Optional PGlite is installed outside this repository; see docs/spicy-archive-report.md.
 */
import { createServer } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import manifest from "../../src/data/private-media-manifest.json" with { type: "json" };

const modulePath = process.env.VG_QA_PGLITE_MODULE;
if (!modulePath)
  throw new Error("Set VG_QA_PGLITE_MODULE to the temporary PGlite module.");
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
await db.exec(
  "create role anon; create role authenticated; create role service_role bypassrls;",
);
for (const file of readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql"))
  .sort())
  await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
const tables = new Set([
  "site_progress",
  "coupon_state",
  "challenge_scores",
  "quiz_attempts",
  "letter_state",
  "achievements",
  "discoveries",
]);
const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const url = new URL(request.url, "http://127.0.0.1:3200");
  try {
    if (request.headers.apikey !== "archive-qa-only")
      throw new Error("Fixture authorization missing.");
    if (
      request.method === "GET" &&
      url.pathname === "/storage/v1/bucket/vg-private-photos"
    ) {
      response.end(
        JSON.stringify({
          id: "vg-private-photos",
          name: "vg-private-photos",
          public: false,
        }),
      );
      return;
    }
    const photo = manifest.find((entry) =>
      [
        "/storage/v1/object/vg-private-photos/" + entry.object,
        "/storage/v1/object/authenticated/vg-private-photos/" + entry.object,
      ].includes(url.pathname),
    );
    if (request.method === "GET" && photo) {
      response.setHeader("Content-Type", "image/webp");
      let bytes;
      try {
        bytes = readFileSync(photo.source);
      } catch {
        bytes = readFileSync(
          ".private-media-source-backup/" + photo.id + ".webp",
        );
      }
      response.end(bytes);
      return;
    }
    if (
      request.method === "POST" &&
      [
        "/rest/v1/rpc/begin_arcade_run",
        "/rest/v1/rpc/finish_arcade_run",
      ].includes(url.pathname)
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const p = JSON.parse(body);
      const begin = url.pathname.endsWith("/begin_arcade_run");
      const result = begin
        ? await db.query(
            "select * from public.begin_arcade_run($1,$2,$3,$4,$5)",
            [
              p.p_run_id,
              p.p_user_id,
              p.p_game_id,
              p.p_difficulty,
              p.p_started_at,
            ],
          )
        : await db.query(
            "select * from public.finish_arcade_run($1,$2,$3,$4,$5,$6,$7::smallint,$8,$9,$10::jsonb,$11::text[],$12,$13)",
            [
              p.p_run_id,
              p.p_user_id,
              p.p_game_id,
              p.p_score,
              p.p_duration_ms,
              p.p_difficulty,
              p.p_progress,
              p.p_ending,
              p.p_won,
              JSON.stringify(p.p_reward_grants),
              p.p_discovered_secrets,
              p.p_finished_at,
              p.p_moves ?? null,
            ],
          );
      response.end(JSON.stringify(result.rows));
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/rest/v1/rpc/grant_experience_coupon"
    ) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const params = JSON.parse(body);
      const result = await db.query(
        "select * from public.grant_experience_coupon($1,$2,$3,$4)",
        [
          params.p_user_id,
          params.p_reward_id,
          params.p_coupon_id,
          params.p_source,
        ],
      );
      response.end(JSON.stringify(result.rows));
      return;
    }
    const table = url.pathname.replace("/rest/v1/", "");
    if (!tables.has(table) || !["GET", "HEAD"].includes(request.method))
      throw new Error("Unsupported fixture request.");
    const result = await db.query(`select * from public.${table}`);
    response.setHeader(
      "Content-Range",
      `0-${Math.max(0, result.rows.length - 1)}/${result.rows.length}`,
    );
    response.end(
      request.method === "HEAD" ? undefined : JSON.stringify(result.rows),
    );
  } catch (error) {
    response.statusCode = 400;
    response.end(JSON.stringify({ message: error.message }));
  }
});
server.listen(3200, "127.0.0.1", () =>
  console.log(
    "Isolated archive PostgreSQL/API fixture ready on 127.0.0.1:3200. No live database is connected.",
  ),
);
process.on("SIGINT", () => {
  server.close();
  void db.close().then(() => process.exit(0));
});
