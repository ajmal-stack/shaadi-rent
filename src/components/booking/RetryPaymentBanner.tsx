"use client";

/**
 * RetryPaymentBanner
 *
 * Shown on the booking detail page when payment_status is still "pending".
 * Embeds CashfreeCheckout so the user can complete payment without starting
 * a new booking. Uses the stored payment_session_id from the payments table.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, AlertCircle } from "lucide-react";
import { CashfreeCheckout } from "@/components/payment/CashfreeCheckout";

interface RetryPaymentBannerProps {
  bookingId: string;
  paymentSessionId: string;
  totalAmount: number;
}

export function RetryPaymentBanner({
  bookingId,
  paymentSessionId,
  totalAmount,
}: RetryPaymentBannerProps) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentClosed, setPaymentClosed] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);

  const handlePaymentComplete = () => {
    setShowCheckout(false);
    setPaymentClosed(true);
  };

  const handleRetry = () => {
    setPaymentClosed(false);
    setAttemptKey((k) => k + 1);
    setShowCheckout(true);
  };

  const handleViewBooking = () => {
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-200">
          <AlertCircle size={18} className="text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Payment Pending</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Complete your payment to confirm this booking.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white border border-amber-100 px-4 py-2.5 text-xs">
        <span className="text-stone-500 font-medium">Amount Due</span>
        <span className="font-extrabold text-stone-900 text-sm">
          {"\u20B9"}{totalAmount.toLocaleString("en-IN")}
        </span>
      </div>

      {showCheckout && !paymentClosed && (
        <CashfreeCheckout
          key={attemptKey}
          paymentSessionId={paymentSessionId}
          onComplete={handlePaymentComplete}
        />
      )}

      {paymentClosed && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-4 text-center">
          <p className="text-xs text-stone-600 font-medium">
            Payment not completed. You can retry anytime within 30 minutes.
          </p>
          <div className="flex w-full gap-2.5">
            <button
              type="button"
              onClick={handleViewBooking}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Refresh Status
            </button>
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 py-2.5 text-xs font-semibold text-white shadow hover:from-rose-800 hover:to-black transition-all"
            >
              Retry Payment
            </button>
          </div>
        </div>
      )}

      {!showCheckout && !paymentClosed && (
        <button
          type="button"
          onClick={() => setShowCheckout(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-bold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95"
        >
          <CreditCard size={16} />
          Complete Payment Now
        </button>
      )}

      <p className="text-[10px] text-center text-amber-700/70">
        Powered by Cashfree Payments {"\u00B7"} 100% Secure {"\u00B7"} Your booking is reserved for 30 min
      </p>
    </div>
  );
}
