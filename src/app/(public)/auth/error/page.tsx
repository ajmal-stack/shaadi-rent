import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error — ShaadiRent",
  description: "Something went wrong during sign-in.",
};

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 px-8 py-10 text-center shadow-2xl ring-1 ring-rose-100">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
          <span aria-hidden="true" className="text-2xl">⚠️</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-gray-900">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Something went wrong during authentication. This could be because
          you cancelled the sign-in, or a temporary error occurred.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Please try again.
        </p>

        <Link
          href="/auth/login"
          id="try-again-link"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
