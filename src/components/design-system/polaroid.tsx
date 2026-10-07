import { ImageIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";

import { Tape } from "@/components/design-system/tape";
import { cn } from "@/lib/cn";

type PolaroidOrientation = "portrait" | "landscape" | "square";
type PolaroidStyle = CSSProperties & { "--polaroid-rotation": string };

interface PolaroidProps {
  src?: string | StaticImageData;
  alt?: string;
  caption?: string;
  label?: string;
  rotation?: number;
  orientation?: PolaroidOrientation;
  taped?: boolean;
  className?: string;
}

export function Polaroid({
  src,
  alt = "",
  caption = "A photograph belongs here",
  label,
  rotation = -2,
  orientation = "portrait",
  taped = false,
  className,
}: PolaroidProps) {
  const style: PolaroidStyle = { "--polaroid-rotation": `${rotation}deg` };

  return (
    <figure className={cn("polaroid", className)} style={style}>
      {taped ? <Tape position="top" rotation={rotation * -0.4} /> : null}
      <div className="polaroid__image" data-orientation={orientation}>
        {src ? (
          <Image
            alt={alt}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 80vw, 24rem"
            src={src}
          />
        ) : (
          <div className="polaroid__placeholder">
            <ImageIcon aria-hidden="true" size={24} strokeWidth={1.35} />
            <span>Photo reserved</span>
          </div>
        )}
      </div>
      <figcaption className="polaroid__caption">
        <span>{caption}</span>
        {label ? <small>{label}</small> : null}
      </figcaption>
    </figure>
  );
}
