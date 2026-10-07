import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <Eyebrow>404 · Minor navigational incident</Eyebrow>
        <h1 className="mt-5 font-display text-6xl tracking-[-0.055em] sm:text-8xl">
          Not part of our story.
        </h1>
        <p className="mx-auto mt-5 max-w-md leading-7 text-[var(--muted)]">
          This page either moved, never existed, or is hiding until Year Two.
        </p>
        <LinkButton className="mt-8" href="/home">
          <ArrowLeft aria-hidden="true" size={15} />
          Back to Year One
        </LinkButton>
      </div>
    </main>
  );
}
