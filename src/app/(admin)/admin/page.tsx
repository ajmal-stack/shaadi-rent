import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Shirt,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Users,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Console — ShaadiRent",
  description: "Administrative control center for ShaadiRent marketplace operations.",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch quick metrics in parallel
  const [
    { count: pendingApplicationsCount },
    { count: totalOwnersCount },
    { count: totalOutfitsCount },
    { count: totalBookingsCount },
    { data: recentApplications },
  ] = await Promise.all([
    supabase
      .from("owner_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner"),
    supabase
      .from("outfits")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("owner_applications")
      .select("id, full_name, phone, status, created_at, id_type, city, state")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 mb-2">
              <Sparkles size={12} />
              Platform Administration
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-900">
              Admin Console
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Manage owner verification, review applications, and oversee marketplace health.
            </p>
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

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Pending Review</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <p className="font-display text-3xl font-bold text-amber-900 mt-2">
              {pendingApplicationsCount ?? 0}
            </p>
            <Link
              href="/admin/applications"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
            >
              <span>Review pending</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Verified Owners</span>
              <Users size={16} className="text-stone-400" />
            </div>
            <p className="font-display text-3xl font-bold text-stone-900 mt-2">
              {totalOwnersCount ?? 0}
            </p>
            <p className="mt-2 text-[11px] text-stone-400">Promoted owners</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total Outfits</span>
              <Shirt size={16} className="text-stone-400" />
            </div>
            <p className="font-display text-3xl font-bold text-stone-900 mt-2">
              {totalOutfitsCount ?? 0}
            </p>
            <p className="mt-2 text-[11px] text-stone-400">In marketplace catalog</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total Bookings</span>
              <CalendarCheck size={16} className="text-stone-400" />
            </div>
            <p className="font-display text-3xl font-bold text-stone-900 mt-2">
              {totalBookingsCount ?? 0}
            </p>
            <p className="mt-2 text-[11px] text-stone-400">All customer bookings</p>
          </div>
        </div>

        {/* Operational Queues */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/admin/applications"
            className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:border-rose-200 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800">
                <ShieldCheck size={22} />
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900 group-hover:text-rose-900 transition-colors">
                Owner Applications Review
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Inspect applicant KYC government ID cards, verify contact numbers, and grant verified owner access.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-rose-800">
              <span>View Queue ({pendingApplicationsCount ?? 0} pending)</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between opacity-80">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
                <Shirt size={22} />
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Outfit Verification Queue
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Review newly listed bridal wear, inspect photo authenticity, and set publication approval.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-stone-400">
              <span>Automated listing review active</span>
            </div>
          </div>
        </div>

        {/* Recent Applications Feed */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">
                Recent Onboarding Applications
              </h2>
              <p className="text-xs text-stone-400">
                Latest submissions from prospective owners
              </p>
            </div>

            <Link
              href="/admin/applications"
              className="text-xs font-semibold text-rose-800 hover:text-rose-950"
            >
              View all →
            </Link>
          </div>

          {!recentApplications || recentApplications.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No applications submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-stone-900">{app.full_name}</span>
                    <p className="text-[11px] text-stone-400">
                      {app.city}, {app.state} • ID: {app.id_type?.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Pending
                      </span>
                    )}
                    {app.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Approved
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                        Rejected
                      </span>
                    )}

                    <Link
                      href="/admin/applications"
                      className="text-stone-700 hover:text-stone-950 font-semibold"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

