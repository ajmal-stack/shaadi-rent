import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error — ShaadiRent",
  description: "Something went wrong during sign-in.",
};

interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const rawMessage = params.message || params.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/95 px-8 py-10 text-center shadow-2xl ring-1 ring-rose-100">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
          <span aria-hidden="true" className="text-2xl">
            ⚠️
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-gray-900">
          Sign-in failed
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Something went wrong during authentication. This could be because you cancelled the sign-in, or a configuration issue occurred with the authentication provider.
        </p>

        {rawMessage && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200/80 p-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
              Error Details:
            </span>
            <p className="mt-1 text-xs text-red-900 font-mono break-all">
              {rawMessage}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/auth/login"
            id="try-again-link"
            className="inline-flex items-center justify-center rounded-xl bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
