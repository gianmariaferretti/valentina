// Copies Excalidraw's fonts into public/excalidraw/fonts so the drawing
// board never downloads anything from a CDN (window.EXCALIDRAW_ASSET_PATH
// is "/excalidraw/"). Runs before `next build` and `next dev`; the folder is
// generated, not committed. Only fonts whose licence is stated in the font
// files themselves are copied (SIL OFL or MIT, see THIRD_PARTY_NOTICES.md).
// Left out: Xiaolai (13 MB of Chinese glyphs), and Excalifont and
// Liberation Sans, whose files do not state an open licence. The board uses
// Virgil by default; missing fonts fall back to the system font.
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(
  root,
  "node_modules/@excalidraw/excalidraw/dist/prod/fonts",
);
const target = join(root, "public/excalidraw/fonts");
export const SELF_HOSTED = [
  "Virgil",
  "Nunito",
  "Lilita",
  "ComicShanns",
  "Cascadia",
  "Assistant",
];

if (!existsSync(source)) {
  console.warn(
    "sync-excalidraw-assets: @excalidraw/excalidraw not installed, skipped",
  );
  process.exit(0);
}
rmSync(target, { recursive: true, force: true });
let copied = 0;
for (const family of SELF_HOSTED) {
  cpSync(join(source, family), join(target, family), { recursive: true });
  copied += readdirSync(join(source, family)).length;
}
console.log(
  `sync-excalidraw-assets: ${copied} font files → public/excalidraw/fonts`,
);
