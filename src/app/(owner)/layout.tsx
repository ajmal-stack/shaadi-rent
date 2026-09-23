import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { LayoutDashboard, LayoutList, CalendarCheck, Wallet } from "lucide-react";

/**
 * Owner route group layout — runs before every page inside (owner)/.
 *
 * Guard: User must be authenticated AND have role = "owner" or "admin".
 * - Unauthenticated → redirect /auth/login
 * - Authenticated but wrong role → redirect /account (not 403, to avoid leaking routes)
 *
 * Admins are allowed because they have super-set access to all owner features.
 *
 * Role is ALWAYS read from the database — never from JWT claims or client input.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch role from profiles table — the source of truth for authorisation.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (role !== "owner" && role !== "admin") {
    // Redirect silently — don't reveal that an owner route exists.
    redirect("/account");
  }

  return (
    <div className="flex flex-col min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />

      {/* Owner quick-nav strip */}
      <div className="border-b border-stone-100 bg-white shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-stone-600 hover:text-rose-800 border-b-2 border-transparent hover:border-rose-400 transition-colors whitespace-nowrap"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
          <Link
            href="/listings"
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-stone-600 hover:text-rose-800 border-b-2 border-transparent hover:border-rose-400 transition-colors whitespace-nowrap"
          >
            <LayoutList size={14} />
            My Listings
          </Link>
          <Link
            href="/requests"
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-stone-600 hover:text-rose-800 border-b-2 border-transparent hover:border-rose-400 transition-colors whitespace-nowrap"
          >
            <CalendarCheck size={14} />
            Booking Requests
          </Link>
          <Link
            href="/earnings"
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-stone-600 hover:text-rose-800 border-b-2 border-transparent hover:border-rose-400 transition-colors whitespace-nowrap"
          >
            <Wallet size={14} />
            Earnings
          </Link>
        </div>
      </div>

      <main className="flex-1 flex flex-col">{children}</main>
      <Footer className="mt-auto hidden md:block" />
    </div>
  );
}

