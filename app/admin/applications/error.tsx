"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-400/25 bg-rose-400/5 p-6">
        <div className="flex items-center gap-3 text-rose-200">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="text-xl font-bold">Applications could not be loaded</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/70">
          The applications page hit an unexpected error. Try again, or return to the dashboard. If the
          problem persists, check the server logs.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-white/35">Reference: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--background)] transition hover:bg-white"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
