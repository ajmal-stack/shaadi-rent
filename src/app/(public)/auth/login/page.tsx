import type { Metadata } from "next";
import { signInWithGoogle } from "@/app/(public)/auth/actions";

export const metadata: Metadata = {
  title: "Login — ShaadiRent",
  description: "Login or create your ShaadiRent account to rent wedding outfits.",
};

/** Google "G" logo SVG — inline so no extra dependency is needed. */
function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  // Validate next param server-side — only allow internal paths
  const rawNext = params.next ?? "";
  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-950 px-4 py-16">
      {/* Decorative background rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-rose-800/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-rose-900/15 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white/95 px-8 py-10 shadow-2xl ring-1 ring-rose-100 backdrop-blur-sm sm:px-10">
        {/* Brand */}
        <div className="mb-8 text-center">
          {/* Decorative motif */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 ring-4 ring-rose-100">
            <span aria-hidden="true" className="text-2xl">
              💍
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-rose-900">
            ShaadiRent
          </h1>
          <p className="mt-1 text-sm font-medium text-rose-600 tracking-wide uppercase">
            {safeNext === "/list-your-outfit"
              ? "List Your Outfit"
              : "Wedding Outfits on Rent"}
          </p>
        </div>

        {safeNext === "/list-your-outfit" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">Sign in to list your outfit</p>
            <p className="mt-0.5 text-amber-800/80">
              You&apos;ll be returned to the listing flow after signing in.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-sm text-gray-500">Login or create your account</p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google OAuth form — Server Action, works without JS */}
        <form action={signInWithGoogle}>
          {/* Pass `next` through as hidden input */}
          {safeNext && (
            <input type="hidden" name="next" value={safeNext} />
          )}
          <button
            type="submit"
            id="google-signin-button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 active:scale-[0.98]"
          >
            <GoogleLogo />
            Continue with Google
          </button>
        </form>

        {/* Terms */}
        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          By continuing, you agree to our{" "}
          <span className="text-gray-500">Terms of Service</span> and{" "}
          <span className="text-gray-500">Privacy Policy</span>.
        </p>
      </div>
    </main>
  );
}
