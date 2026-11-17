/**
 * An animated Meteocons icon (self-hosted in public/weather/). With reduced
 * motion the browser picks the static version by itself — no JavaScript.
 * Icons: Meteocons by Bas Milius, MIT (see THIRD_PARTY_NOTICES.md).
 */
export function WeatherIcon({
  slug,
  label,
  size = 28,
  className,
}: {
  slug: string;
  label: string;
  size?: number;
  className?: string;
}) {
  return (
    <picture className={className}>
      <source
        media="(prefers-reduced-motion: reduce)"
        srcSet={`/weather/static/${slug}.svg`}
      />
      <img
        alt={label}
        className="inline-block shrink-0"
        decoding="async"
        height={size}
        loading="lazy"
        src={`/weather/animated/${slug}.svg`}
        width={size}
      />
    </picture>
  );
}
