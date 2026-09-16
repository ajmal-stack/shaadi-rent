import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  PackageCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { DeliveryAddress } from "@/types/database";

export const metadata: Metadata = {
  title: "Booking Confirmed — ShaadiRent",
  description: "Your outfit rental has been confirmed.",
};

interface ConfirmedPageProps {
  params: Promise<{ id: string }>;
}

const TIMELINE_STEPS = [
  {
    icon: Truck,
    label: "Delivery & Fitting",
    desc: "Outfit delivered to your doorstep, 48 hrs before your event",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: Sparkles,
    label: "Your Event Day",
    desc: "Wear, celebrate, and make memories",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    icon: PackageCheck,
    label: "Return Pickup",
    desc: "We collect the outfit from your doorstep",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    icon: ShieldCheck,
    label: "Deposit Refund",
    desc: "Security deposit refunded after inspection (2–3 business days)",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
];

export default async function BookingConfirmedPage({ params }: ConfirmedPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch the booking, verify it belongs to this user
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
      delivery_address,
      outfits!bookings_outfit_id_fkey (
        id,
        title,
        brand,
        city,
        state
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
  } | null;

  const deliveryAddr = booking.delivery_address as unknown as DeliveryAddress | null;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-stone-50 py-12 sm:py-16">
      {/* ── Confetti dots (pure CSS) ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {[...Array(18)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full opacity-70"
            style={{
              width: `${8 + (i % 5) * 4}px`,
              height: `${8 + (i % 5) * 4}px`,
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 23 + 10) % 60}%`,
              background: ["#fde68a", "#fca5a5", "#a7f3d0", "#c4b5fd", "#93c5fd", "#fdba74"][i % 6],
              animation: `confetti-fall ${1.5 + (i % 4) * 0.4}s ease-in ${(i % 6) * 0.15}s both`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateY(60px) rotate(${Math.random() > 0.5 ? "" : "-"}180deg); opacity: 0; }
        }
        @keyframes check-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          70% { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-check { animation: check-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 space-y-6">
        {/* ── Success Header ── */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="animate-check w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={44} className="text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
              Booking Confirmed!
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Your outfit has been reserved. We&apos;ll reach out to coordinate delivery.
            </p>
          </div>

          {/* Booking Number Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700">Booking ID</span>
            <span className="text-sm font-extrabold text-emerald-900 tracking-widest">
              #{booking.booking_number}
            </span>
          </div>
        </div>

        {/* ── Outfit & Dates Card ── */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          {/* Outfit */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">
                {outfit?.title ?? "Your Outfit"}
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
          </div>

          <div className="border-t border-stone-100 pt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Delivery Date</span>
              <span className="font-bold text-stone-900 mt-0.5 block">
                {fmtDate(booking.rental_start_date)}
              </span>
            </div>
            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Return Pickup</span>
              <span className="font-bold text-stone-900 mt-0.5 block">
                {fmtDate(booking.rental_end_date)}
              </span>
            </div>
            {booking.event_date && (
              <div className="col-span-2 rounded-xl bg-rose-50 border border-rose-100 p-3">
                <span className="text-[10px] uppercase font-bold text-rose-400 block flex items-center gap-1">
                  <Calendar size={10} /> Event / Wedding Date
                </span>
                <span className="font-bold text-rose-900 mt-0.5 block">
                  {fmtDate(booking.event_date)}
                </span>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border-t border-stone-100 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Rental Amount</span>
              <span className="font-semibold text-stone-800">₹{booking.rental_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Security Deposit (Refundable)</span>
              <span className="font-semibold text-stone-800">₹{booking.security_deposit.toLocaleString("en-IN")}</span>
            </div>
            {booking.service_fee > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Service Fee</span>
                <span className="font-semibold text-stone-800">₹{booking.service_fee.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-stone-200/80 pt-2 font-extrabold text-sm text-stone-950">
              <span>Total Payable</span>
              <span>₹{booking.total_amount.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[10px] text-stone-400 italic">Payable to our agent at time of delivery.</p>
          </div>

          {/* Delivery Address */}
          {deliveryAddr && (
            <div className="border-t border-stone-100 pt-4 space-y-1 text-xs">
              <p className="font-bold text-stone-700 flex items-center gap-1.5 mb-2">
                <MapPin size={12} className="text-rose-700" />
                Delivering to:
              </p>
              <p className="font-semibold text-stone-900">{deliveryAddr.full_name}</p>
              <p className="text-stone-600">+91 {deliveryAddr.phone}</p>
              <p className="text-stone-600">{deliveryAddr.address_line1}{deliveryAddr.address_line2 ? `, ${deliveryAddr.address_line2}` : ""}</p>
              <p className="text-stone-600">{deliveryAddr.city}, {deliveryAddr.state} — {deliveryAddr.pincode}</p>
            </div>
          )}
        </div>

        {/* ── Timeline ── */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-1">
          <h3 className="text-sm font-bold text-stone-800 mb-4">What happens next?</h3>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${step.bg} ${step.border}`}
                >
                  <step.icon size={17} className={step.color} />
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-stone-800">{step.label}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className="absolute left-[2.65rem] mt-9 w-0.5 h-3 bg-stone-200 ml-[-1.3rem]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <Link
            href="/bookings"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
          >
            <Calendar size={16} />
            View My Bookings
          </Link>
          <Link
            href="/browse"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Home size={16} />
            Browse More Outfits
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
