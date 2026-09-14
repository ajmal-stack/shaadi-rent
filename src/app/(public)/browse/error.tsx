"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface BrowseErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BrowseError({ error, reset }: BrowseErrorProps) {
  useEffect(() => {
    // Log privately without exposing raw errors to the user UI
    console.error("Browse page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertCircle size={28} />
        </div>

        <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold text-stone-900">
          Something went wrong while loading outfits.
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
          We encountered an issue retrieving the wedding collections. Please try
          again or return to our homepage.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-950 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Home size={14} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
