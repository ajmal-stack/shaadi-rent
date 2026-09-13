import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = {
  title: "My Account — ShaadiRent",
  description: "Your ShaadiRent account.",
};

/** Map DB role enum values to a human-readable label. */
function formatRole(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    default:
      return "Customer";
  }
}

/** Colour badge per role. */
function roleBadgeClass(role: string): string {
  switch (role) {
    case "owner":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "admin":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    default:
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

export default async function AccountPage() {
  const supabase = await createClient();

  // ── Auth check (belt-and-suspenders; middleware already redirects) ──────────
  // IMPORTANT: use getUser() not getSession() — getUser() validates the JWT
  // with Supabase rather than trusting the cookie value alone.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/auth/login");
  }

  // ── Fetch profile from the existing profiles table ──────────────────────────
  // The relationship auth.users.id → profiles.id is enforced by FK + trigger.
  // We use the authenticated user ID from the server — never trust client input.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role, avatar_url, verification_status")
    .eq("id", user.id)
    .single();

  // Derive display values — fall back to Google auth metadata gracefully.
  const displayName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "User";

  const displayEmail = profile?.email ?? user.email ?? "";
  const displayRole = profile?.role ?? "customer";

  // Google provides avatar_url in user_metadata; the DB trigger does not
  // populate it on signup, so we read from auth metadata as fallback.
  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    null;

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-rose-50/60 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-rose-600 to-rose-400" />

          <div className="px-8 py-8">
            {/* Avatar + name */}
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${displayName}'s profile picture`}
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-rose-100 shadow-md"
                  priority
                />
              ) : (
                // Fallback initials avatar
                <div
                  aria-label={`Avatar for ${displayName}`}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 ring-4 ring-rose-200 shadow-md"
                >
                  <span className="font-display text-2xl font-bold text-rose-700">
                    {initials}
                  </span>
                </div>
              )}

              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">
                  Welcome, {displayName.split(" ")[0]}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Your ShaadiRent account
                </p>
              </div>
            </div>

            {/* Info list */}
            <dl className="divide-y divide-gray-100 rounded-xl bg-gray-50 ring-1 ring-gray-100">
              {/* Email */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900 text-right break-all">
                  {displayEmail}
                </dd>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${roleBadgeClass(displayRole)}`}
                  >
                    {formatRole(displayRole)}
                  </span>
                </dd>
              </div>
            </dl>

            {/* Profile missing warning */}
            {profileError && (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
                ⚠️ Your profile record could not be loaded. Some information
                may be incomplete. This usually resolves on next sign-in.
              </p>
            )}

            {/* Sign out */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <SignOutButton
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Sign out
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
