// Generates the app icons from one original V+G monogram (pure shapes, no
// fonts), so the result never depends on the machine. Run:
//   node scripts/generate-icons.mjs
import { writeFileSync } from "node:fs";

import sharp from "sharp";

const INK = "#241e1c";
const PAPER = "#f2ebe0";
const ROSE = "#d4776c";

/** The monogram on a 512 grid; `rounded` = rounded square, else full bleed. */
export function monogram({ rounded }) {
  const background = rounded
    ? `<rect width="512" height="512" rx="116" fill="${INK}"/>`
    : `<rect width="512" height="512" fill="${INK}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${background}
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="${
    // Full-bleed icons are masked (circle on Android): keep to the safe zone.
    rounded
      ? "translate(-24 0)"
      : "translate(256 256) scale(0.84) translate(-280 -256)"
  }">
    <path d="M108 176 L164 336 L220 176" stroke="${PAPER}" stroke-width="34"/>
    <path d="M267 244 V268 M255 256 H279" stroke="${ROSE}" stroke-width="14"/>
    <path d="M434 206 A70 70 0 1 0 452 274 V258 H398" stroke="${PAPER}" stroke-width="34"/>
  </g>
</svg>
`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

/** An .ico that simply wraps one PNG (supported by every current browser). */
function ico(pngBuffer, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuffer.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, pngBuffer]);
}

const rounded = monogram({ rounded: true });
const bleed = monogram({ rounded: false });

writeFileSync("src/app/icon.svg", rounded);
writeFileSync("public/icons/icon-192.png", await png(rounded, 192));
writeFileSync("public/icons/icon-512.png", await png(rounded, 512));
writeFileSync("public/icons/maskable-512.png", await png(bleed, 512));
// iOS rounds the corners itself: full bleed.
writeFileSync("src/app/apple-icon.png", await png(bleed, 180));
writeFileSync("src/app/favicon.ico", ico(await png(rounded, 32), 32));
console.log("Icons written.");
