import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  ShieldCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MobileRequestsView } from "@/components/owner/MobileRequestsView";

export const metadata: Metadata = {
  title: "Booking Requests — ShaadiRent Owner",
  description: "Manage incoming bookings for your listed outfits.",
};

interface OwnerBookingItem {
  id: string;
  booking_number: string;
  status: string;
  payment_status: string;
  rental_start_date: string;
  rental_end_date: string;
  event_date: string | null;
  total_amount: number;
  created_at: string;
  outfits: { id: string; title: string; brand: string | null } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

const STATUS_INFO: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; desc: string }
> = {
  pending:          { label: "New Request",       color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  icon: Clock,         desc: "Awaiting your acceptance" },
  confirmed:        { label: "Confirmed",          color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   icon: CheckCircle2,  desc: "Confirmed — preparing outfit" },
  pickup_scheduled: { label: "Pickup Scheduled",  color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200", icon: CalendarCheck, desc: "Ready to hand over" },
  out_for_delivery: { label: "Out for Delivery",  color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",    icon: Truck,         desc: "En route to customer" },
  delivered:        { label: "Delivered",          color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",   icon: PackageCheck,  desc: "Customer has the outfit" },
  active:           { label: "Active Rental",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",icon: Sparkles,      desc: "Customer wearing it!" },
  return_scheduled: { label: "Return Incoming",   color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200", icon: CalendarCheck, desc: "Pickup scheduled" },
  returned:         { label: "Returned",           color: "text-stone-600",   bg: "bg-stone-50",   border: "border-stone-200",  icon: PackageCheck,  desc: "Awaiting inspection" },
  inspection:       { label: "Under Inspection",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200", icon: ShieldCheck,   desc: "Inspection in progress" },
  completed:        { label: "Completed",          color: "text-emerald-700", bg: "bg-emerald-100",border: "border-emerald-300",icon: CheckCircle2,  desc: "All done" },
  cancelled:        { label: "Cancelled",          color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",   icon: XCircle,       desc: "Booking cancelled" },
  disputed:         { label: "Disputed",           color: "text-orange-800",  bg: "bg-orange-50",  border: "border-orange-200", icon: AlertCircle,   desc: "Under dispute review" },
};

const ACTION_REQUIRED = ["pending", "pickup_scheduled", "return_scheduled", "returned"];
const ACTIVE_STATUSES = ["confirmed", "out_for_delivery", "delivered", "active"];
const TERMINAL_STATUSES = ["completed", "cancelled", "disputed"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OwnerRequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    notFound();
  }

  const query = supabase
    .from("bookings")
    .select(`
      id,
      booking_number,
      status,
      payment_status,
      rental_start_date,
      rental_end_date,
      event_date,
      total_amount,
      created_at,
      outfits!bookings_outfit_id_fkey (
        id,
        title,
        brand
      ),
      profiles!bookings_renter_id_fkey (
        full_name,
        phone
      )
    `)
    .order("created_at", { ascending: false });

  const { data: bookings } = profile.role === "owner"
    ? await query.eq("owner_id", user.id)
    : await query;

  const allBookings = (bookings ?? []) as unknown as OwnerBookingItem[];

  const actionRequired = allBookings.filter((b) => ACTION_REQUIRED.includes(b.status));
  const activeBookings = allBookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const pastBookings   = allBookings.filter((b) => TERMINAL_STATUSES.includes(b.status));

  return (
    <>
      {/* ── Mobile View (< md) ── */}
      <div className="block md:hidden">
        <MobileRequestsView bookings={allBookings} />
      </div>

      {/* ── Desktop View (>= md) ── */}
      <div className="hidden md:block min-h-screen bg-stone-50/50 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
                <CalendarCheck size={13} className="text-rose-700" />
                My Outfit Bookings
              </span>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Booking Requests
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {allBookings.length > 0
                  ? `${allBookings.length} booking${allBookings.length !== 1 ? "s" : ""} · ${actionRequired.length} need${actionRequired.length !== 1 ? "" : "s"} action`
                  : "Manage bookings for your listed outfits."}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              &larr; Dashboard
            </Link>
          </div>

          {/* ── Empty state ── */}
          {allBookings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-rose-200/80 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <CalendarCheck size={30} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-stone-900">No Bookings Yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
                Bookings for your outfits will appear here as customers start requesting them.
              </p>
            </div>
          )}

          {/* ── Action Required ── */}
          {actionRequired.length > 0 && (
            <BookingSection
              title="Action Required"
              titleColor="text-rose-800"
              badgeColor="bg-rose-100 text-rose-800 border-rose-200"
              count={actionRequired.length}
              bookings={actionRequired}
            />
          )}

          {/* ── Active ── */}
          {activeBookings.length > 0 && (
            <BookingSection
              title="Active Bookings"
              titleColor="text-stone-700"
              badgeColor="bg-blue-50 text-blue-800 border-blue-200"
              count={activeBookings.length}
              bookings={activeBookings}
            />
          )}

          {/* ── Past ── */}
          {pastBookings.length > 0 && (
            <BookingSection
              title="Completed &amp; Cancelled"
              titleColor="text-stone-500"
              badgeColor="bg-stone-100 text-stone-600 border-stone-200"
              count={pastBookings.length}
              bookings={pastBookings}
              muted
            />
          )}
        </div>
      </div>
    </>
  );
}

function BookingSection({
  title,
  titleColor,
  badgeColor,
  count,
  bookings,
  muted = false,
}: {
  title: string;
  titleColor: string;
  badgeColor: string;
  count: number;
  bookings: OwnerBookingItem[];
  muted?: boolean;
}) {
  const ACTION_REQUIRED_SET = ["pending", "pickup_scheduled", "return_scheduled", "returned"];
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>{title}</h2>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>{count}</span>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => {
          const info = STATUS_INFO[booking.status] ?? STATUS_INFO["pending"];
          const StatusIcon = info.icon;
          const needsAction = ACTION_REQUIRED_SET.includes(booking.status);
          const renter = booking.profiles;

          return (
            <Link
              key={booking.id}
              href={`/requests/${booking.id}`}
              className={`group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                muted
                  ? "border-stone-100 opacity-75 hover:opacity-100 hover:border-stone-200"
                  : needsAction
                  ? "border-rose-200 hover:border-rose-400 hover:shadow-md"
                  : "border-stone-200 hover:border-stone-300 hover:shadow-md"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${info.bg} ${info.border}`}>
                <StatusIcon size={22} className={info.color} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 truncate text-sm">
                      {booking.outfits?.title ?? `Booking #${booking.booking_number}`}
                    </p>
                    {booking.outfits?.brand && (
                      <p className="text-[11px] font-semibold text-amber-800">{booking.outfits.brand}</p>
                    )}
                    {renter?.full_name && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Customer: <span className="font-semibold text-stone-700">{renter.full_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.bg} ${info.color} ${info.border}`}>
                      {needsAction && <span className="mr-0.5">&#9679;</span>}
                      {info.label}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                  <span>Delivery: {fmtDate(booking.rental_start_date)}</span>
                  <span>Return: {fmtDate(booking.rental_end_date)}</span>
                  <span className="font-bold text-stone-700">&#8377;{booking.total_amount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <ChevronRight
                size={15}
                className={`shrink-0 transition-all ${
                  needsAction
                    ? "text-rose-500 group-hover:text-rose-700 group-hover:translate-x-0.5"
                    : "text-stone-300 group-hover:text-stone-500"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
