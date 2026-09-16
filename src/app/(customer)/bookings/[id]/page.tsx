import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  ChevronLeft,
  MapPin,
  Wallet,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { CustomerActions } from "@/components/booking/CustomerActions";
import type { BookingStatus, DeliveryAddress } from "@/types/database";

export const metadata: Metadata = {
  title: "Booking Details — ShaadiRent",
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_DISPLAY: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending:            { label: "Pending",              color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"  },
  confirmed:          { label: "Confirmed",             color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"   },
  pickup_scheduled:   { label: "Pickup Scheduled",      color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  out_for_delivery:   { label: "Out for Delivery",      color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200"    },
  delivered:          { label: "Delivered",             color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200"   },
  active:             { label: "Active Rental",         color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200"},
  return_scheduled:   { label: "Return Scheduled",      color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  returned:           { label: "Returned",              color: "text-stone-600",   bg: "bg-stone-50",   border: "border-stone-200"  },
  inspection:         { label: "Under Inspection",      color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
  completed:          { label: "Completed",             color: "text-emerald-700", bg: "bg-emerald-100",border: "border-emerald-300"},
  cancelled:          { label: "Cancelled",             color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"   },
  disputed:           { label: "Disputed",              color: "text-orange-800",  bg: "bg-orange-50",  border: "border-orange-200" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      event_date,
      rental_start_date,
      rental_end_date,
      rental_amount,
      security_deposit,
      delivery_fee,
      service_fee,
      total_amount,
      status,
      payment_status,
      created_at,
      outfits!bookings_outfit_id_fkey (
        id,
        title,
        brand,
        city,
        state,
        slug
      )
    `
    )
    .eq("id", id)
    .eq("renter_id", user.id)
    .single();

  if (error || !booking) notFound();

  const outfit = booking.outfits as unknown as {
    id: string;
    title: string;
    brand: string | null;
    city: string | null;
    state: string | null;
    slug: string;
  } | null;

  const statusInfo = STATUS_DISPLAY[booking.status] ?? STATUS_DISPLAY["pending"];

  // delivery_address is a JSONB column — access via unknown cast since Supabase's
  // template-literal parser doesn't pick it up from manually-updated Row types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBooking = booking as any;
  const deliveryAddr = rawBooking.delivery_address as DeliveryAddress | null;

  const isCompleted = booking.status === "completed";
  const isTerminal = booking.status === "completed" || booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">
        {/* ── Back nav ── */}
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft size={14} />
          My Bookings
        </Link>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">
              Booking #{booking.booking_number}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Placed on {fmtDate(booking.created_at)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* ── Customer Action Banner ── */}
        {!isTerminal && (
        <CustomerActions
            bookingId={booking.id}
            status={booking.status as BookingStatus}
            returnDate={booking.rental_end_date}
          />
        )}

        {/* ── Outfit Card ── */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-stone-900 truncate">
                {outfit?.title ?? "Outfit"}
              </h2>
              {outfit?.brand && (
                <p className="text-xs font-semibold text-amber-800">{outfit.brand}</p>
              )}
              {outfit?.city && (
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-rose-500" />
                  {outfit.city}, {outfit.state ?? "India"}
                </p>
              )}
            </div>
            {outfit?.slug && (
              <Link
                href={`/outfits/${outfit.slug}`}
                className="text-xs font-semibold text-rose-800 hover:text-rose-950 shrink-0"
              >
                View Outfit →
              </Link>
            )}
          </div>

          {/* Rental Dates */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-stone-100">
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Delivery Date</span>
              <span className="font-bold text-stone-900 mt-0.5 block">{fmtDate(booking.rental_start_date)}</span>
            </div>
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Return Pickup</span>
              <span className="font-bold text-stone-900 mt-0.5 block">{fmtDate(booking.rental_end_date)}</span>
            </div>
            {booking.event_date && (
              <div className="col-span-2 rounded-xl bg-rose-50 border border-rose-100 p-3">
                <span className="text-[10px] uppercase font-bold text-rose-400 block">Event / Wedding Date</span>
                <span className="font-bold text-rose-900 mt-0.5 block">{fmtDate(booking.event_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Booking Progress Timeline ── */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-5">Booking Progress</h3>
        <BookingTimeline
            currentStatus={booking.status as BookingStatus}
            deliveryDate={booking.rental_start_date}
            returnDate={booking.rental_end_date}
            eventDate={booking.event_date}
          />
        </div>

        {/* ── Delivery Address (if available) ── */}
        {deliveryAddr && (
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <MapPin size={15} className="text-rose-700" />
              Delivery Address
            </h3>
            <div className="text-xs text-stone-600 space-y-0.5 pl-6">
              <p className="font-semibold text-stone-900">{deliveryAddr.full_name}</p>
              <p>+91 {deliveryAddr.phone}</p>
              <p>{deliveryAddr.address_line1}{deliveryAddr.address_line2 ? `, ${deliveryAddr.address_line2}` : ""}</p>
              <p>{deliveryAddr.city}, {deliveryAddr.state} — {deliveryAddr.pincode}</p>
            </div>
          </div>
        )}

        {/* ── Payment Breakdown ── */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2 text-xs">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
            <Wallet size={15} className="text-stone-600" />
            Payment Breakdown
          </h3>
          <div className="flex justify-between text-stone-600">
            <span>Rental Amount</span>
            <span className="font-semibold text-stone-800">₹{booking.rental_amount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Security Deposit (Refundable)</span>
            <span className="font-semibold text-stone-800">₹{booking.security_deposit.toLocaleString("en-IN")}</span>
          </div>
          {booking.delivery_fee > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-stone-800">₹{booking.delivery_fee.toLocaleString("en-IN")}</span>
            </div>
          )}
          {booking.service_fee > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Platform Service Fee</span>
              <span className="font-semibold text-stone-800">₹{booking.service_fee.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200/80 pt-2 font-extrabold text-sm text-stone-950">
            <span>Total Payable</span>
            <span>₹{booking.total_amount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-stone-500">Payment Status</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                booking.payment_status === "paid"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {booking.payment_status === "paid" ? "Paid" : "Pay at Delivery"}
            </span>
          </div>
        </div>

        {/* ── Completed — Review Prompt ── */}
        {isCompleted && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm space-y-2">
            <p className="font-bold text-amber-900">🌟 How was your experience?</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your booking is complete! Reviews help other brides &amp; grooms make better decisions.
              Review feature coming soon.
            </p>
          </div>
        )}

        {/* ── Support Note ── */}
        {!isCompleted && booking.status !== "cancelled" && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <HelpCircle size={14} />
              Need help with this booking?
            </p>
            <p className="text-amber-800 leading-relaxed">
              Contact ShaadiRent support via WhatsApp or email if you need to change dates, report a fit issue, or have any concerns. We&apos;re available 24×7.
            </p>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Link
            href="/bookings"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft size={14} />
            All My Bookings
          </Link>
          <Link
            href="/browse"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 py-3 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
          >
            <Sparkles size={14} />
            Browse More Outfits
          </Link>
        </div>
      </div>
    </div>
  );
}
