import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShoppingBag,
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

export const metadata: Metadata = {
  title: "My Bookings — ShaadiRent",
  description: "Track your outfit rentals and upcoming deliveries.",
};

interface BookingItem {
  id: string;
  booking_number: string;
  status: string;
  payment_status: string;
  rental_start_date: string;
  rental_end_date: string;
  event_date: string | null;
  total_amount: number;
  security_deposit: number;
  created_at: string;
  outfits: {
    id: string;
    title: string;
    brand: string | null;
  } | null;
}

const STATUS_INFO: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; desc: string }
> = {
  pending:          { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock, desc: "Awaiting confirmation" },
  confirmed:        { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: CheckCircle2, desc: "Your booking is confirmed" },
  pickup_scheduled: { label: "Pickup Scheduled", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: Calendar, desc: "Outfit pickup has been scheduled" },
  out_for_delivery: { label: "Out for Delivery", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", icon: Truck, desc: "On its way to you" },
  delivered:        { label: "Delivered", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", icon: PackageCheck, desc: "Outfit delivered" },
  active:           { label: "Active Rental", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: Sparkles, desc: "Enjoy your outfit!" },
  return_scheduled: { label: "Return Scheduled", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: Calendar, desc: "Return pickup scheduled" },
  returned:         { label: "Returned", color: "text-stone-600", bg: "bg-stone-50", border: "border-stone-200", icon: PackageCheck, desc: "Outfit returned" },
  inspection:       { label: "Inspection", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: ShieldCheck, desc: "Outfit under inspection" },
  completed:        { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300", icon: CheckCircle2, desc: "Booking completed" },
  cancelled:        { label: "Cancelled", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", icon: XCircle, desc: "This booking was cancelled" },
  disputed:         { label: "Disputed", color: "text-orange-800", bg: "bg-orange-50", border: "border-orange-200", icon: AlertCircle, desc: "Dispute under review" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = user
    ? await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_number,
          status,
          payment_status,
          rental_start_date,
          rental_end_date,
          event_date,
          total_amount,
          security_deposit,
          created_at,
          outfits (
            id,
            title,
            brand
          )
        `
        )
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const hasBookings = bookings && bookings.length > 0;

  // Group: active/upcoming vs past
  const activeStatuses = ["pending", "confirmed", "pickup_scheduled", "out_for_delivery", "delivered", "active", "return_scheduled", "returned", "inspection"];
  const activeBookings = (bookings ?? []).filter((b: BookingItem) => activeStatuses.includes(b.status));
  const pastBookings = (bookings ?? []).filter((b: BookingItem) => !activeStatuses.includes(b.status));

  return (
    <div className="min-h-screen bg-stone-50/50 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
              <Calendar size={13} className="text-rose-700" />
              My Rentals
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {hasBookings
                ? `${bookings!.length} booking${bookings!.length !== 1 ? "s" : ""} — track deliveries, active rentals & returns`
                : "Track your outfit deliveries, active rentals, and return pickups."}
            </p>
          </div>

          <Link
            href="/browse"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-black transition-all"
          >
            <Sparkles size={15} />
            Rent Another Outfit
          </Link>
        </div>

        {/* ── Content ── */}
        {!hasBookings ? (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-rose-200/80 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <ShoppingBag size={30} />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-stone-900">
              No Bookings Yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
              You haven&apos;t reserved any wedding outfits yet. Browse our curated collections and rent your dream outfit!
            </p>
            <div className="mt-6">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 transition-colors"
              >
                <span>Explore Outfits</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active / Upcoming */}
            {activeBookings.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Active & Upcoming
                </h2>
                <div className="space-y-3">
                  {activeBookings.map((booking: BookingItem) => {
                    const info = STATUS_INFO[booking.status] ?? STATUS_INFO["pending"];
                    const StatusIcon = info.icon;
                    return (
                      <Link
                        key={booking.id}
                        href={`/bookings/${booking.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-rose-200 hover:shadow-md transition-all"
                      >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${info.bg} ${info.border}`}>
                          <StatusIcon size={22} className={info.color} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 truncate">
                                {booking.outfits?.title ?? `Booking #${booking.booking_number}`}
                              </p>
                              {booking.outfits?.brand && (
                                <p className="text-[11px] font-semibold text-amber-800">{booking.outfits.brand}</p>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${info.bg} ${info.color} ${info.border}`}>
                              {info.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1">
                              <Truck size={11} />
                              Delivery: {fmtDate(booking.rental_start_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <PackageCheck size={11} />
                              Return: {fmtDate(booking.rental_end_date)}
                            </span>
                          </div>
                        </div>

                        {/* Amount + chevron */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="font-bold text-stone-900 text-sm">₹{booking.total_amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-stone-400">Total</span>
                          <ChevronRight size={14} className="mt-2 text-stone-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Past Bookings
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking: BookingItem) => {
                    const info = STATUS_INFO[booking.status] ?? STATUS_INFO["completed"];
                    const StatusIcon = info.icon;
                    return (
                      <Link
                        key={booking.id}
                        href={`/bookings/${booking.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-stone-100 bg-white/60 p-5 shadow-sm hover:border-stone-200 hover:bg-white hover:shadow-md transition-all opacity-80 hover:opacity-100"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${info.bg} ${info.border}`}>
                          <StatusIcon size={22} className={info.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-700 truncate">
                            {booking.outfits?.title ?? `Booking #${booking.booking_number}`}
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            #{booking.booking_number} · {fmtDate(booking.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.bg} ${info.color} ${info.border}`}
                          >
                            {info.label}
                          </span>
                          <span className="font-bold text-stone-600 text-sm mt-1">₹{booking.total_amount.toLocaleString("en-IN")}</span>
                          <ChevronRight size={14} className="mt-1 text-stone-300 group-hover:text-stone-500 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
