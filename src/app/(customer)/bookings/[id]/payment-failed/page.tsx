import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { XCircle, RefreshCw, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment Failed — ShaadiRent",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentFailedPage({ params }: Props) {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_number, total_amount, outfit_id, outfits!bookings_outfit_id_fkey(slug)")
    .eq("id", bookingId)
    .eq("renter_id", user.id)
    .single();

  if (!booking) notFound();

  const outfitSlug = (booking.outfits as unknown as { slug: string } | null)?.slug;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-stone-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 flex items-center justify-center shadow-lg">
            <XCircle size={40} className="text-rose-600" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">
            Payment Failed
          </h1>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            Your payment was not completed. Your booking has been put on hold —
            you can try paying again or choose different dates.
          </p>
        </div>

        {/* Booking ref */}
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2">
          <span className="text-xs font-semibold text-rose-700">Booking</span>
          <span className="text-sm font-extrabold text-rose-900 tracking-widest">
            #{booking.booking_number}
          </span>
        </div>

        {/* Reasons */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm text-left space-y-2">
          <p className="text-xs font-bold text-stone-700">Common reasons:</p>
          <ul className="text-xs text-stone-500 space-y-1 list-disc list-inside leading-relaxed">
            <li>Insufficient balance or card limit reached</li>
            <li>Bank declined the transaction</li>
            <li>UPI timeout or incorrect PIN</li>
            <li>Payment session expired</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {outfitSlug && (
            <Link
              href={`/outfits/${outfitSlug}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
            >
              <RefreshCw size={16} />
              Try Again — Go Back to Outfit
            </Link>
          )}
          <Link
            href="/bookings"
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            View My Bookings
          </Link>
        </div>

        {/* Support */}
        <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
          <MessageCircle size={12} />
          If money was deducted, contact support and we&apos;ll resolve it within 24 hours.
        </p>
      </div>
    </div>
  );
}
