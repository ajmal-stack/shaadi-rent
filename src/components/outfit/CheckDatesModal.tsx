"use client";

import { useState, useTransition } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
} from "lucide-react";
import { createBooking } from "@/app/actions/booking";
import type { DeliveryAddress } from "@/types/database";

interface CheckDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitId: string;
  ownerId: string;
  outfitTitle: string;
  rentalPrice: number;
  securityDeposit: number;
  selectedDate?: string;
  deliveryDateStr?: string;
  returnDateStr?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
}

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Summary", "Delivery", "Confirm"];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-1">
      {([1, 2, 3] as Step[]).map((step) => {
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : active
                  ? "bg-rose-700 border-rose-700 text-white"
                  : "bg-white border-stone-300 text-stone-400"
              }`}
            >
              {done ? <CheckCircle2 size={12} /> : step}
            </div>
            <span
              className={`text-[10px] font-semibold hidden sm:block ${
                active ? "text-stone-800" : "text-stone-400"
              }`}
            >
              {STEP_LABELS[step - 1]}
            </span>
            {step < 3 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  done ? "bg-emerald-400" : "bg-stone-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry","Chandigarh","Andaman and Nicobar Islands",
];

export function CheckDatesModal({
  isOpen,
  onClose,
  outfitId,
  ownerId,
  outfitTitle,
  rentalPrice,
  securityDeposit,
  selectedDate,
  deliveryDateStr,
  returnDateStr,
  rentalStartDate,
  rentalEndDate,
}: CheckDatesModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Delivery address fields
  const [addr, setAddr] = useState<DeliveryAddress>({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addrErrors, setAddrErrors] = useState<Partial<Record<keyof DeliveryAddress, string>>>({});

  if (!isOpen) return null;

  const serviceFee = Math.round(rentalPrice * 0.05);
  const totalAmount = rentalPrice + securityDeposit + serviceFee;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateAddress = () => {
    const errs: Partial<Record<keyof DeliveryAddress, string>> = {};
    if (!addr.full_name.trim()) errs.full_name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(addr.phone.trim()))
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!addr.address_line1.trim()) errs.address_line1 = "Address is required";
    if (!addr.city.trim()) errs.city = "City is required";
    if (!addr.state) errs.state = "State is required";
    if (!/^\d{6}$/.test(addr.pincode.trim())) errs.pincode = "Enter a valid 6-digit pincode";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!validateAddress()) return;
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    setError(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !rentalStartDate || !rentalEndDate) return;
    setError(null);

    startTransition(async () => {
      const result = await createBooking({
        outfitId,
        ownerId,
        eventDate: selectedDate,
        rentalStartDate,
        rentalEndDate,
        rentalAmount: rentalPrice,
        securityDeposit,
        deliveryAddress: addr,
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleBackdropClick = () => {
    if (!isPending) {
      setStep(1);
      setError(null);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-rose-100 bg-white shadow-2xl z-10 animate-in slide-in-from-bottom-4 sm:fade-in sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 pt-5 pb-4 rounded-t-3xl">
          {!isPending && (
            <button
              type="button"
              onClick={handleBackdropClick}
              aria-label="Close modal"
              className="absolute top-4 right-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <StepIndicator current={step} />
          <p className="text-center text-[10px] text-stone-400 mt-1 truncate">{outfitTitle}</p>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* ── STEP 1: Price Summary ───────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Availability Verified
                </span>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-stone-900">
                  Ready for Booking
                </h3>
              </div>

              {/* Rental Itinerary */}
              {selectedDate && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-2.5 text-xs">
                  <p className="font-bold text-rose-950 flex items-center gap-1.5">
                    <Calendar size={14} className="text-rose-700" />
                    <span>Your 4-Day Rental Itinerary</span>
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

              {/* Price Breakdown */}
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
                  <span>Platform Service Fee (5%)</span>
                  <span className="font-semibold text-stone-900">
                    ₹{serviceFee.toLocaleString("en-IN")}
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

              {/* Policy */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-[11px] text-amber-900 space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <Sparkles size={13} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Booking Flow Ready.</strong> This outfit is open for your selected date window.
                    Online payment and identity verification will be unlocked in the upcoming Booking phase.
                    No charge has been made.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95"
                >
                  <span>Next: Delivery Details</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleBackdropClick}
                  className="rounded-xl border border-stone-200 px-4 py-3.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Delivery Address ────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-800">
                  <MapPin size={13} className="text-blue-600" />
                  Delivery Details
                </span>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-stone-900">
                  Where should we deliver?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Our partner agent will deliver the outfit directly to this address on{" "}
                  <strong className="text-stone-700">{deliveryDateStr}</strong>.
                </p>
              </div>

              {/* Address Form */}
              <div className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <User size={11} className="inline mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={addr.full_name}
                    onChange={(e) => setAddr({ ...addr, full_name: e.target.value })}
                    placeholder="As on your ID proof"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all ${
                      addrErrors.full_name ? "border-rose-400 bg-rose-50/50" : "border-stone-200 bg-stone-50/50"
                    }`}
                  />
                  {addrErrors.full_name && (
                    <p className="text-[11px] text-rose-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={11} />{addrErrors.full_name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <Phone size={11} className="inline mr-1" />
                    Mobile Number
                  </label>
                  <div className="flex items-center border rounded-xl overflow-hidden bg-stone-50/50 focus-within:ring-2 focus-within:ring-rose-600/30 transition-all"
                    style={{ borderColor: addrErrors.phone ? "#f87171" : "#e7e5e4" }}
                  >
                    <span className="px-3 py-2.5 text-sm text-stone-500 font-semibold border-r border-stone-200 bg-stone-100 shrink-0">+91</span>
                    <input
                      type="tel"
                      value={addr.phone}
                      onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                  {addrErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={11} />{addrErrors.phone}
                    </p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addr.address_line1}
                    onChange={(e) => setAddr({ ...addr, address_line1: e.target.value })}
                    placeholder="House / Flat no., Building, Street"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all ${
                      addrErrors.address_line1 ? "border-rose-400 bg-rose-50/50" : "border-stone-200 bg-stone-50/50"
                    }`}
                  />
                  {addrErrors.address_line1 && (
                    <p className="text-[11px] text-rose-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={11} />{addrErrors.address_line1}
                    </p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Address Line 2 <span className="normal-case font-normal text-stone-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addr.address_line2 ?? ""}
                    onChange={(e) => setAddr({ ...addr, address_line2: e.target.value })}
                    placeholder="Locality, Landmark, Area"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all"
                  />
                </div>

                {/* City + Pincode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">City</label>
                    <input
                      type="text"
                      value={addr.city}
                      onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                      placeholder="City"
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all ${
                        addrErrors.city ? "border-rose-400 bg-rose-50/50" : "border-stone-200 bg-stone-50/50"
                      }`}
                    />
                    {addrErrors.city && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{addrErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={addr.pincode}
                      onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all ${
                        addrErrors.pincode ? "border-rose-400 bg-rose-50/50" : "border-stone-200 bg-stone-50/50"
                      }`}
                    />
                    {addrErrors.pincode && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{addrErrors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">State</label>
                  <select
                    value={addr.state}
                    onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all appearance-none bg-stone-50/50 ${
                      addrErrors.state ? "border-rose-400" : "border-stone-200"
                    }`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {addrErrors.state && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{addrErrors.state}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-3.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95"
                >
                  <span>Review &amp; Confirm</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Final Confirmation ──────────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Almost There!
                </span>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-stone-900">
                  Confirm Your Booking
                </h3>
              </div>

              {/* Address Summary */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-xs space-y-1.5">
                <p className="font-bold text-stone-700 flex items-center gap-1.5 mb-2">
                  <Truck size={13} className="text-rose-700" />
                  Delivering to:
                </p>
                <p className="font-semibold text-stone-900">{addr.full_name}</p>
                <p className="text-stone-600">+91 {addr.phone}</p>
                <p className="text-stone-600">
                  {addr.address_line1}
                  {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                </p>
                <p className="text-stone-600">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="text-[10px] text-stone-400 pt-1">
                  Expected delivery: <strong className="text-stone-700">{deliveryDateStr}</strong>
                </p>
              </div>

              {/* Final Price */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Rental Fee (4 Days)</span>
                  <span className="font-semibold text-stone-900">₹{rentalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Refundable Security Deposit</span>
                  <span className="font-semibold text-stone-900">
                    {securityDeposit > 0 ? `₹${securityDeposit.toLocaleString("en-IN")}` : "Zero Deposit"}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Platform Service Fee (5%)</span>
                  <span className="font-semibold text-stone-900">₹{serviceFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200/80 pt-2 font-extrabold text-sm text-stone-950">
                  <span>Total Payable</span>
                  <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-start gap-1.5 pt-1 border-t border-stone-100">
                  <CreditCard size={12} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-stone-500">
                    Payment will be collected by our partner delivery agent at the time of delivery. No advance payment required.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-3.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm &amp; Book Now</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
