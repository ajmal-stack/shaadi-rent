"use client";

import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface CheckDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitTitle: string;
  rentalPrice: number;
  securityDeposit: number;
  selectedDate?: string;
  deliveryDateStr?: string;
  returnDateStr?: string;
}

export function CheckDatesModal({
  isOpen,
  onClose,
  outfitTitle,
  rentalPrice,
  securityDeposit,
  selectedDate,
  deliveryDateStr,
  returnDateStr,
}: CheckDatesModalProps) {
  if (!isOpen) return null;

  const totalAmount = rentalPrice + securityDeposit;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Availability Verified
            </span>
            <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-stone-900">
              Ready for Booking
            </h3>
            <p className="text-xs text-stone-500 mt-1 truncate">
              {outfitTitle}
            </p>
          </div>

          {/* Schedule Summary */}
          {selectedDate && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-2.5 text-xs">
              <p className="font-bold text-rose-950 flex items-center gap-1.5">
                <Calendar size={14} className="text-rose-700" />
                <span>Your 4-Day Rental Itinerary:</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-stone-700">
                <div className="bg-white/80 rounded-xl p-2.5 border border-rose-100/60">
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">
                    Delivery &amp; Fitting
                  </span>
                  <span className="font-semibold text-stone-900 block mt-0.5">
                    {deliveryDateStr || "48 hrs prior"}
                  </span>
                </div>
                <div className="bg-white/80 rounded-xl p-2.5 border border-rose-100/60">
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">
                    Doorstep Return Pickup
                  </span>
                  <span className="font-semibold text-stone-900 block mt-0.5">
                    {returnDateStr || "Day after event"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Price Breakdown from DB */}
          <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Rental Fee (4 Days)</span>
              <span className="font-semibold text-stone-900">
                ₹{rentalPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Refundable Security Deposit</span>
              <span className="font-semibold text-stone-900">
                {securityDeposit > 0
                  ? `₹${securityDeposit.toLocaleString("en-IN")}`
                  : "Zero Deposit"}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Sanitization &amp; Alteration Kit</span>
              <span className="font-semibold text-emerald-700">FREE</span>
            </div>
            <div className="flex justify-between border-t border-stone-200/80 pt-2 text-sm font-extrabold text-stone-950">
              <span>Total Estimated</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Next Phase Notice (No booking created) */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles size={14} className="text-amber-700" />
              <span>Booking Flow Ready</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This outfit is open for your selected date window. Online payment and identity verification will be unlocked in the upcoming Booking phase. No charge has been made.
            </p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95"
            >
              Continue Browsing Outfits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
