import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const dependency = new URL("node_modules/@monogatari/core/", root);
const metadata = JSON.parse(
  await readFile(new URL("package.json", dependency), "utf8"),
);
if (metadata.version !== "2.6.0" || metadata.license !== "MIT")
  throw new Error("Re-audit Monogatari before changing the pinned engine.");
const target = new URL("public/vendor/monogatari/", root);
await mkdir(target, { recursive: true });
const output = await build({
  entryPoints: [fileURLToPath(new URL("src/actions/Function.js", dependency))],
  outfile: fileURLToPath(new URL("function-action-2.6.0.mjs", target)),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  legalComments: "inline",
  metafile: true,
});
// Audit the actual reachable dependency graph, not just the top-level package.
if (
  Object.keys(output.metafile.inputs).some((path) =>
    /mousetrap|fontawesome|tsparticles/.test(path),
  )
)
  throw new Error(
    "Unexpected global input/rendering dependency in the headless story bundle.",
  );
await Promise.all([
  copyFile(new URL("LICENSE", dependency), new URL("LICENSE", target)),
  writeFile(
    new URL("THIRD_PARTY_LICENSES.txt", target),
    (
      await Promise.all(
        ["@monogatari/core/LICENSE", "@aegis-framework/artemis/LICENSE"].map(
          async (path) =>
            `${path}\n\n${await readFile(new URL(`node_modules/${path}`, root), "utf8")}\n`,
        ),
      )
    ).join("\n-----\n\n"),
  ),
]);
console.log(
  `Prepared MIT Monogatari 2.6.0 function-action runtime (${Object.keys(output.metafile.inputs).length} source modules, lazy-loaded only).`,
);
