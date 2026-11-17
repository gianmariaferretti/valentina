/** A hand-drawn signature PNG from the signature pad, checked on the server. */
export function validSignatureImage(value: string): boolean {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
    return false;
  const bytes = Buffer.from(
    value.slice("data:image/png;base64,".length),
    "base64",
  );
  return (
    bytes.length >= 500 &&
    bytes.length <= 250_000 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.readUInt32BE(16) >= 300 &&
    bytes.readUInt32BE(16) <= 1400 &&
    bytes.readUInt32BE(20) >= 120 &&
    bytes.readUInt32BE(20) <= 600
  );
}
