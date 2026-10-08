"use client";

import Link from "next/link";

export default function ExperienceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container py-10 sm:py-16">
      <section className="archive-error" role="alert">
        <p>Archive interruption · {error.digest ?? "local"}</p>
        <h1>This page misplaced itself.</h1>
        <span>
          The rest of Year One is safe. Try opening this section again, or
          return to the index.
        </span>
        <div>
          <button onClick={reset} type="button">
            Try again
          </button>
          <Link href="/home">Return home</Link>
        </div>
      </section>
    </div>
  );
}
