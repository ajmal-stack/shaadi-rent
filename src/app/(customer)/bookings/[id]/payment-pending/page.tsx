import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, RefreshCw, MessageCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment Pending — ShaadiRent",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentPendingPage({ params }: Props) {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_number, total_amount, status, payment_status")
    .eq("id", bookingId)
    .eq("renter_id", user.id)
    .single();

  if (!booking) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-stone-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center shadow-lg">
            <Clock size={40} className="text-amber-600" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">
            Payment Pending
          </h1>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            We&apos;re waiting for your payment to be confirmed. This usually
            takes a few seconds. You can refresh the page to check the status.
          </p>
        </div>

        {/* Booking ref */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2">
          <span className="text-xs font-semibold text-amber-700">Booking</span>
          <span className="text-sm font-extrabold text-amber-900 tracking-widest">
            #{booking.booking_number}
          </span>
        </div>

        {/* Amount */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Amount to be paid</p>
          <p className="font-display text-3xl font-bold text-stone-900 mt-1">
            ₹{Number(booking.total_amount).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-1.5 text-left">
          <p className="font-bold">What&apos;s happening?</p>
          <ul className="space-y-1 text-amber-800 leading-relaxed list-disc list-inside">
            <li>Your payment is being processed by our payment gateway.</li>
            <li>If you completed payment, your booking will be confirmed shortly.</li>
            <li>If you did not complete payment, you can go back and try again.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/bookings/${bookingId}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
          >
            <RefreshCw size={16} />
            Check Booking Status
          </Link>
          <Link
            href="/browse"
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Browse
          </Link>
        </div>

        {/* Support */}
        <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
          <MessageCircle size={12} />
          Need help? Contact ShaadiRent support — we&apos;re available 24×7.
        </p>
      </div>
    </div>
  );
}
