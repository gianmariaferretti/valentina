import { Plane, ScanLine } from "lucide-react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface PostageStampProps {
  country?: string;
  value?: string;
  year?: string;
  tone?: "burgundy" | "blue" | "mustard";
  className?: string;
}

export function PostageStamp({
  country = "Italia",
  value = "1.00",
  year = "2025",
  tone = "burgundy",
  className,
}: PostageStampProps) {
  return (
    <div className={cn("postage-stamp", className)} data-tone={tone}>
      <div className="postage-stamp__inner">
        <span>{country}</span>
        <Plane aria-hidden="true" size={29} strokeWidth={1.25} />
        <span>
          {value} · {year}
        </span>
      </div>
    </div>
  );
}

type StampStyle = CSSProperties & { "--stamp-rotation": string };

interface PassportStampProps {
  location: string;
  date: string;
  code?: string;
  rotation?: number;
  className?: string;
}

export function PassportStamp({
  location,
  date,
  code = "V&G",
  rotation = -7,
  className,
}: PassportStampProps) {
  const style: StampStyle = { "--stamp-rotation": `${rotation}deg` };

  return (
    <div className={cn("passport-stamp", className)} style={style}>
      <span className="passport-stamp__code">{code}</span>
      <strong>{location}</strong>
      <span>{date}</span>
    </div>
  );
}

interface LuggageTagProps {
  from: string;
  to: string;
  name?: string;
  date?: string;
  className?: string;
}

export function LuggageTag({
  from,
  to,
  name = "V + G",
  date = "04 OCT",
  className,
}: LuggageTagProps) {
  return (
    <div className={cn("luggage-tag", className)}>
      <div className="luggage-tag__hole" />
      <div className="luggage-tag__meta">
        <span>{name}</span>
        <span>{date}</span>
      </div>
      <div className="luggage-tag__route">
        <strong>{from}</strong>
        <Plane aria-hidden="true" size={18} />
        <strong>{to}</strong>
      </div>
      <div className="luggage-tag__barcode">
        <ScanLine aria-hidden="true" size={21} />
        <span>YEAR ONE · BAG 01</span>
      </div>
    </div>
  );
}
