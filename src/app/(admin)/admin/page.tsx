import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts";
import type { RecentBooking } from "@/components/admin/dashboard/RecentBookingsFeed";

export const metadata: Metadata = {
  title: "Admin Console — ShaadiRent",
  description: "Administrative control center for ShaadiRent marketplace operations.",
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns an array of YYYY-MM-DD strings for the last N days (oldest → newest). */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Format date as "DD MMM" label e.g. "10 Sep" */
function fmtLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Start of current month as ISO string */
function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/** Start of last month */
function startOfLastMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
}

/** Compute % trend between current and previous period counts. */
function trend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();

  const thisMonthStart = startOfMonth();
  const lastMonthStart = startOfLastMonth();

  // ── Parallel data fetches ─────────────────────────────────────
  const [
    { count: pendingApplicationsCount },
    { count: totalOwnersCount },
    { count: totalOutfitsCount },
    { count: totalBookingsCount },
    { data: recentApplications },
    // Bookings in last 30 days for sparkline
    { data: bookingsLast30 },
    // All bookings for status breakdown
    { data: allBookingsStatus },
    // Payments (successful) for revenue
    { data: paymentsLast14 },
    { data: paymentsThisMonth },
    { data: paymentsLastMonth },
    // Bookings this month vs last for trend
    { count: bookingsThisMonth },
    { count: bookingsLastMonth },
    // Recent bookings feed
    { data: recentBookingsRaw },
    // New users this month
    { count: newUsersThisMonth },
    // All-time platform revenue
    { data: allRevenue },
  ] = await Promise.all([
    supabase
      .from("owner_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner"),
    supabase.from("outfits").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("owner_applications")
      .select("id, full_name, phone, status, created_at, id_type, city, state")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5),
    // Bookings last 30 days
    supabase
      .from("bookings")
      .select("created_at")
      .gte("created_at", thirtyDaysAgoISO),
    // All bookings statuses
    supabase.from("bookings").select("status"),
    // Revenue last 14 days
    supabase
      .from("payments")
      .select("amount, created_at")
      .eq("status", "successful")
      .gte("created_at", fourteenDaysAgoISO),
    // Revenue this month
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "successful")
      .gte("created_at", thisMonthStart),
    // Revenue last month
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "successful")
      .gte("created_at", lastMonthStart)
      .lt("created_at", thisMonthStart),
    // Bookings this month
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart),
    // Bookings last month
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart)
      .lt("created_at", thisMonthStart),
    // Recent bookings feed
    supabase
      .from("bookings")
      .select(
        `id, booking_number, total_amount, status, payment_status, created_at,
         outfits!bookings_outfit_id_fkey ( title ),
         profiles!bookings_renter_id_fkey ( full_name )`
      )
      .order("created_at", { ascending: false })
      .limit(6),
    // New users this month
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart),
    // All-time successful payments
    supabase.from("payments").select("amount").eq("status", "successful"),
  ]);

  // ── Aggregate bookings by day (last 30) ───────────────────────
  const days30 = getLastNDays(30);
  const bookingCountByDay: Record<string, number> = {};
  days30.forEach((d) => (bookingCountByDay[d] = 0));
  (bookingsLast30 ?? []).forEach((b) => {
    const day = b.created_at.slice(0, 10);
    if (day in bookingCountByDay) bookingCountByDay[day]++;
  });
  const bookingsByDay = days30.map((d) => bookingCountByDay[d]);
  const bookingLabels = days30.map(fmtLabel);

  // ── Aggregate revenue by day (last 14) ────────────────────────
  const days14 = getLastNDays(14);
  const revenueByDayMap: Record<string, number> = {};
  days14.forEach((d) => (revenueByDayMap[d] = 0));
  (paymentsLast14 ?? []).forEach((p) => {
    const day = p.created_at.slice(0, 10);
    if (day in revenueByDayMap) revenueByDayMap[day] += p.amount;
  });
  const revenueByDay = days14.map((d) => ({
    label: fmtLabel(d),
    value: Math.round(revenueByDayMap[d]),
  }));

  // ── Booking status breakdown ───────────────────────────────────
  const statusCount: Record<string, number> = {};
  (allBookingsStatus ?? []).forEach((b) => {
    statusCount[b.status] = (statusCount[b.status] ?? 0) + 1;
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    active: "#10b981",
    completed: "#78716c",
    cancelled: "#f43f5e",
    disputed: "#f97316",
    returned: "#14b8a6",
    delivered: "#6366f1",
    pickup_scheduled: "#8b5cf6",
    out_for_delivery: "#0ea5e9",
    return_scheduled: "#64748b",
    inspection: "#84cc16",
  };

  const bookingStatusBreakdown = Object.entries(statusCount)
    .map(([label, value]) => ({
      label: label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: STATUS_COLORS[label] ?? "#a8a29e",
    }))
    .sort((a, b) => b.value - a.value);

  // ── Revenue totals ─────────────────────────────────────────────
  const totalRevenue = (allRevenue ?? []).reduce((s, p) => s + p.amount, 0);
  const revenueThisMonth = (paymentsThisMonth ?? []).reduce((s, p) => s + p.amount, 0);
  const revenueLastMonth = (paymentsLastMonth ?? []).reduce((s, p) => s + p.amount, 0);

  // ── Trends ────────────────────────────────────────────────────
  const bookingsTrend = trend(bookingsThisMonth ?? 0, bookingsLastMonth ?? 0);
  const revenueTrend = trend(revenueThisMonth, revenueLastMonth);

  // ── Recent bookings feed ───────────────────────────────────────
  const recentBookings: RecentBooking[] = (recentBookingsRaw ?? []).map(
    (b: Record<string, unknown>) => ({
      id: b.id as string,
      booking_number: b.booking_number as string,
      total_amount: b.total_amount as number,
      status: b.status as string,
      payment_status: b.payment_status as string,
      created_at: b.created_at as string,
      outfit_title:
        ((b["outfits!bookings_outfit_id_fkey"] as { title: string } | null)?.title ??
         (b.outfits as { title: string } | null)?.title ??
         null),
      renter_name:
        ((b["profiles!bookings_renter_id_fkey"] as { full_name: string | null } | null)?.full_name ??
         (b.profiles as { full_name: string | null } | null)?.full_name ??
         null),
    })
  );

  // ── Today's date label ────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 mb-2">
              <Sparkles size={12} />
              Platform Administration
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100">
              Admin Console
            </h1>
            <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">{todayLabel}</p>
          </div>

          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-black transition-all"
          >
            <ShieldCheck size={16} />
            <span>Applications Queue ({pendingApplicationsCount ?? 0})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── Dynamic Charts + KPIs (Client Component) ──────── */}
        <DashboardCharts
          pendingApplicationsCount={pendingApplicationsCount ?? 0}
          totalOwnersCount={totalOwnersCount ?? 0}
          totalOutfitsCount={totalOutfitsCount ?? 0}
          totalBookingsCount={totalBookingsCount ?? 0}
          totalRevenue={Math.round(totalRevenue)}
          newUsersThisMonth={newUsersThisMonth ?? 0}
          bookingsByDay={bookingsByDay}
          bookingLabels={bookingLabels}
          revenueByDay={revenueByDay}
          bookingStatusBreakdown={bookingStatusBreakdown}
          recentBookings={recentBookings}
          bookingsTrend={bookingsTrend}
          revenueTrend={revenueTrend}
        />

        {/* ── Recent Applications Feed ───────────────────────── */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                Recent Onboarding Applications
              </h2>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Latest submissions from prospective owners
              </p>
            </div>
            <Link
              href="/admin/applications"
              className="text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-950 dark:hover:text-rose-300"
            >
              View all →
            </Link>
          </div>

          {!recentApplications || recentApplications.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-6 text-center">
              No applications submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{app.full_name}</span>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      {app.city}, {app.state} · ID: {app.id_type?.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        Pending
                      </span>
                    )}
                    {app.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        Approved
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300">
                        Rejected
                      </span>
                    )}
                    <Link
                      href="/admin/applications"
                      className="text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 font-semibold"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Actions ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/admin/applications"
            className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm hover:border-rose-200 dark:hover:border-rose-800/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/50 flex items-center justify-center text-rose-800 dark:text-rose-400">
                <ShieldCheck size={22} />
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-rose-900 dark:group-hover:text-rose-300 transition-colors">
                Owner Applications Review
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Inspect applicant KYC government ID cards, verify contact numbers, and grant verified owner access.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-400">
              <span>View Queue ({pendingApplicationsCount ?? 0} pending)</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          <Link
            href="/admin/bookings"
            className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm hover:border-violet-200 dark:hover:border-violet-800/60 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 flex items-center justify-center text-violet-700 dark:text-violet-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-violet-900 dark:group-hover:text-violet-300 transition-colors">
                Manage All Bookings
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Track, filter, and manage all rental bookings across the platform — from pending to completed.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-violet-700 dark:text-violet-400">
              <span>View all {totalBookingsCount ?? 0} bookings</span>
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>
      </div>
    </div>

  );
}
