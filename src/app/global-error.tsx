"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center bg-[#241e1c] p-6 text-[#fbf8f3]">
          <section className="max-w-xl text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">
              V&amp;G · Private archive
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-none">
              The archive needs a moment.
            </h1>
            <p className="mt-6 leading-7 text-white/65">
              Nothing has been lost. Reload this private corner and try again.
            </p>
            <button
              className="mt-8 min-h-12 rounded-full bg-[#fbf8f3] px-7 text-xs font-bold tracking-[0.14em] text-[#241e1c] uppercase"
              onClick={reset}
              type="button"
            >
              Reload archive
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
