"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** Private photographs never reach Next's shared image optimizer. A failed
 * private download gets an explicit, non-sensitive placeholder, not a public copy.
 */
export default function MediaImage({
  src,
  alt,
  onError,
  ...props
}: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  const isPrivate =
    typeof src === "string" && src.startsWith("/api/private-media/");
  const failed = isPrivate && failedSource === src;
  return (
    <Image
      {...props}
      src={failed ? "/images/private-photo-unavailable.svg" : src}
      alt={failed ? "Private photograph temporarily unavailable" : alt}
      unoptimized={isPrivate || props.unoptimized}
      onError={(event) => {
        if (isPrivate) setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
