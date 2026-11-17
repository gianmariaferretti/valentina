/** Checks an uploaded bucket-list photo by its bytes, not its name. */
export const MAX_PHOTO_BYTES = 2_500_000;

export function photoKind(bytes: Uint8Array): "webp" | "jpg" | null {
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return "webp";
  if (
    bytes.length > 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "jpg";
  return null;
}
