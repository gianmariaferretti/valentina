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

interface BoardingPassProps {
  code: string;
  city: string;
  country: string;
  date: string;
  passenger?: string;
  className?: string;
}

export function BoardingPass({
  code,
  city,
  country,
  date,
  passenger = "V + G",
  className,
}: BoardingPassProps) {
  return (
    <div className={cn("boarding-pass", className)}>
      <div className="boarding-pass__main">
        <div className="boarding-pass__meta">
          <span>Boarding pass · Year One</span>
          <span>Private archive</span>
        </div>
        <div className="boarding-pass__route">
          <div>
            <small>From</small>
            <strong>US</strong>
          </div>
          <span aria-hidden="true">
            <Plane size={20} />
          </span>
          <div>
            <small>To</small>
            <strong>{code}</strong>
          </div>
        </div>
        <div className="boarding-pass__details">
          <span>
            <small>Passenger</small>
            <strong>{passenger}</strong>
          </span>
          <span>
            <small>Destination</small>
            <strong>{city}</strong>
          </span>
          <span>
            <small>Date</small>
            <strong>{date}</strong>
          </span>
        </div>
      </div>
      <div className="boarding-pass__stub">
        <span>{country}</span>
        <ScanLine aria-hidden="true" size={30} />
        <strong>{code} · 01</strong>
      </div>
    </div>
  );
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
