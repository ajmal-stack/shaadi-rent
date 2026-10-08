import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  Lock,
  Truck,
  CreditCard,
  Banknote,
  Zap,
  BookmarkCheck,
} from "lucide-react";
import { createBooking } from "@/app/actions/booking";
import { getSavedDeliveryAddress, saveDeliveryAddress } from "@/app/actions/address";
import { CashfreeCheckout } from "@/components/payment/CashfreeCheckout";
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

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Summary", "Delivery", "Confirm", "Pay"];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 w-full max-w-sm mx-auto">
      {([1, 2, 3, 4] as Step[]).map((step) => {
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                done
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : active
                  ? "bg-rose-800 border-rose-800 text-white shadow-xs ring-2 ring-rose-200"
                  : "bg-white border-stone-300 text-stone-400"
              }`}
            >
              {done ? <CheckCircle2 size={12} className="stroke-[2.5]" /> : step}
            </div>
            <span
              className={`text-[11px] font-semibold hidden md:inline-block ${
                active ? "text-stone-900 font-bold" : "text-stone-400"
              }`}
            >
              {STEP_LABELS[step - 1]}
            </span>
            {step < 4 && (
              <div
                className={`w-5 sm:w-8 h-0.5 mx-0.5 sm:mx-1 rounded-full ${
                  done ? "bg-emerald-500" : "bg-stone-200"
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
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  // Tracks whether the Cashfree modal was closed before payment was completed
  const [paymentClosed, setPaymentClosed] = useState(false);
  // Incrementing this key force-remounts <CashfreeCheckout>, resetting hasLaunched
  const [attemptKey, setAttemptKey] = useState(0);
  // Payment method: "online" = Cashfree gateway | "cod" = Cash on Delivery
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");

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

  // ── Saved Address & 1-Click Checkout States ───────────────────────────────
  const [savedAddress, setSavedAddress] = useState<DeliveryAddress | null>(null);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [isUsingSaved, setIsUsingSaved] = useState(true);
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Client-side mount tracking for portal rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Dismiss on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        handleBackdropClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending]);

  // Load saved address automatically when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // 1. Instant check from localStorage for fastest zero-latency prefill
    try {
      const local = localStorage.getItem("shaadirent_saved_address");
      if (local) {
        const parsed = JSON.parse(local) as DeliveryAddress;
        if (parsed.full_name && parsed.address_line1 && parsed.city && parsed.pincode) {
          if (isMounted) {
            setAddr(parsed);
            setSavedAddress(parsed);
            setHasSavedAddress(true);
            setIsUsingSaved(true);
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // 2. Query server for authenticated user's profile address or past booking
    getSavedDeliveryAddress().then((res) => {
      if (!isMounted || !res.address) return;

      if (res.hasFullAddress) {
        setAddr(res.address);
        setSavedAddress(res.address);
        setHasSavedAddress(true);
        setIsUsingSaved(true);
        try {
          localStorage.setItem("shaadirent_saved_address", JSON.stringify(res.address));
        } catch {}
      } else {
        // Pre-fill partial contact info
        setAddr((prev) => ({
          ...prev,
          full_name: res.address?.full_name || prev.full_name,
          phone: res.address?.phone || prev.phone,
          city: res.address?.city || prev.city,
          state: res.address?.state || prev.state,
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

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
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateAddress()) return;
      if (saveForFuture) {
        try {
          localStorage.setItem("shaadirent_saved_address", JSON.stringify(addr));
          saveDeliveryAddress(addr).catch(() => {});
        } catch {}
      }
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
        customerPhone: addr.phone,
        paymentMethod,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // COD: booking already confirmed — go straight to the confirmed page
      if (result.codBookingId) {
        router.push(`/bookings/${result.codBookingId}/confirmed`);
        return;
      }

      // Online: proceed to Cashfree step
      if (result.paymentSessionId && result.bookingId) {
        setPaymentSessionId(result.paymentSessionId);
        setBookingId(result.bookingId);
        setStep(4);
      }
    });
  };

  const handlePaymentComplete = () => {
    // The Cashfree modal closed — we don't know yet if payment succeeded.
    // Show the retry UI; the user can retry or navigate to their booking.
    setPaymentClosed(true);
  };

  const handleRetryPayment = () => {
    setPaymentClosed(false);
    setAttemptKey((k) => k + 1); // force-remount CashfreeCheckout
  };

  const handleViewBooking = () => {
    if (bookingId) router.push(`/bookings/${bookingId}`);
  };

  const handleBackdropClick = () => {
    if (!isPending) {
      setStep(1);
      setError(null);
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-lg md:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-stone-100 bg-white shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom-4 sm:fade-in sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-5 sm:px-6 pt-4 pb-3 rounded-t-3xl shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-800 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full truncate max-w-[200px] sm:max-w-xs">
              {outfitTitle}
            </span>
            {!isPending && (
              <button
                type="button"
                onClick={handleBackdropClick}
                aria-label="Close modal"
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <StepIndicator current={step} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 pt-4 space-y-4">
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

              <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
                {hasSavedAddress ? (
                  <>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-stone-200 bg-stone-50/90 hover:bg-stone-100 hover:text-stone-900 py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-stone-700 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
                    >
                      <span className="truncate">Review / Change Address</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (validateAddress()) {
                          setStep(3);
                        } else {
                          setStep(2);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-rose-700 to-rose-900 py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-950/15 hover:from-amber-700 hover:to-stone-950 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                    >
                      <Zap size={15} className="text-amber-300 fill-amber-300 shrink-0" />
                      <span className="truncate">⚡ 1-Click Checkout</span>
                      <span className="hidden sm:inline text-xs font-medium opacity-90 shrink-0">
                        • ₹{totalAmount.toLocaleString("en-IN")}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleBackdropClick}
                      className="flex-1 flex items-center justify-center rounded-xl sm:rounded-2xl border border-stone-200 bg-stone-50/90 hover:bg-stone-100 py-3.5 px-4 text-xs sm:text-sm font-semibold text-stone-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span>Next: Delivery Details</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </button>
                  </>
                )}
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

              {/* Saved Address 1-Click Card (if available) */}
              {hasSavedAddress && savedAddress && (
                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-4 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold self-start">
                      <Zap size={11} className="fill-amber-500 text-amber-600" />
                      Saved 1-Click Address
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isUsingSaved) {
                          setIsUsingSaved(false);
                        } else {
                          setAddr(savedAddress);
                          setIsUsingSaved(true);
                        }
                      }}
                      className="text-xs font-semibold text-rose-800 hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      {isUsingSaved ? "Edit / Use Different Address" : "Restore Saved Address"}
                    </button>
                  </div>

                  <div className="text-xs text-stone-700 space-y-0.5 pl-1">
                    <p className="font-bold text-stone-900 text-sm">{savedAddress.full_name}</p>
                    <p className="text-stone-600">+91 {savedAddress.phone}</p>
                    <p className="text-stone-600">
                      {savedAddress.address_line1}
                      {savedAddress.address_line2 ? `, ${savedAddress.address_line2}` : ""}
                    </p>
                    <p className="text-stone-600">
                      {savedAddress.city}, {savedAddress.state} — {savedAddress.pincode}
                    </p>
                  </div>

                  {isUsingSaved && (
                    <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                      <span>Pre-filled &amp; ready for instant delivery</span>
                    </div>
                  )}
                </div>
              )}

              {/* Address Form */}
              <div className="space-y-3">
                {(!hasSavedAddress || !isUsingSaved) && (
                  <>
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
                  </>
                )}

              {/* Save address checkbox (only shown when editing or entering new address) */}
              {(!hasSavedAddress || !isUsingSaved) && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 pt-1">
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-stone-300 text-rose-700 focus:ring-rose-600"
                  />
                  <BookmarkCheck size={14} className="text-stone-500" />
                  <span>Save this address for 1-click rentals on future bookings</span>
                </label>
              )}
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
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Truck size={13} className="text-rose-700" />
                    Delivering to:
                  </p>
                  {hasSavedAddress && isUsingSaved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      <Zap size={10} className="fill-amber-500 text-amber-600" />
                      1-Click Address
                    </span>
                  )}
                </div>
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

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-700">Choose Payment Method</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Online Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "online"
                        ? "border-rose-400 bg-rose-50 text-rose-800 shadow-sm ring-2 ring-rose-200"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      paymentMethod === "online" ? "bg-rose-100" : "bg-stone-100"
                    }`}>
                      <CreditCard size={18} className={paymentMethod === "online" ? "text-rose-700" : "text-stone-500"} />
                    </div>
                    <span>Pay Online</span>
                    <span className={`text-[10px] font-normal ${
                      paymentMethod === "online" ? "text-rose-600" : "text-stone-400"
                    }`}>UPI / Card / Net Banking</span>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all ${
                      paymentMethod === "cod"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-200"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      paymentMethod === "cod" ? "bg-emerald-100" : "bg-stone-100"
                    }`}>
                      <Banknote size={18} className={paymentMethod === "cod" ? "text-emerald-700" : "text-stone-500"} />
                    </div>
                    <span>Pay on Delivery</span>
                    <span className={`text-[10px] font-normal ${
                      paymentMethod === "cod" ? "text-emerald-600" : "text-stone-400"
                    }`}>Cash at doorstep</span>
                  </button>
                </div>

                {/* COD note */}
                {paymentMethod === "cod" && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-[11px] text-emerald-800">
                    <Banknote size={13} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>Pay <strong>₹{totalAmount.toLocaleString("en-IN")}</strong> in cash when your outfit is delivered. No online transaction needed.</span>
                  </div>
                )}
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
                  <Lock size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-stone-500">
                    {paymentMethod === "cod"
                      ? "Cash payment collected by our delivery agent. Security deposit refunded after inspection."
                      : "Secure online payment via Cashfree. Card and UPI details are never stored by ShaadiRent."}
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
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                    paymentMethod === "cod"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900"
                      : "bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 hover:from-rose-800 hover:to-black"
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{paymentMethod === "cod" ? "Confirming Booking..." : "Creating Booking..."}</span>
                    </>
                  ) : (
                    <>
                      {paymentMethod === "cod" ? <Banknote size={16} /> : <Lock size={16} />}
                      <span>{paymentMethod === "cod" ? "Confirm — Pay on Delivery" : "Proceed to Secure Payment"}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 4: Cashfree Payment */}
          {step === 4 && paymentSessionId && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                  <Lock size={13} className="text-emerald-600" />
                  Secure Checkout
                </span>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-stone-900">
                  Complete Your Payment
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Total:{" "}
                  <strong className="text-stone-900">
                    Rs.{(rentalPrice + securityDeposit + Math.round(rentalPrice * 0.05)).toLocaleString("en-IN")}
                  </strong>
                  {" "} via Cashfree Payments
                </p>
              </div>

              {paymentClosed ? (
                /* Payment modal was closed — show retry / view-booking options */
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                    <AlertCircle size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">Payment not completed</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Your booking is saved. You can retry payment or check your booking status.
                    </p>
                  </div>
                  <div className="flex w-full gap-2.5">
                    <button
                      type="button"
                      onClick={handleViewBooking}
                      className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      View Booking
                    </button>
                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      className="flex-1 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 py-2.5 text-xs font-semibold text-white shadow hover:from-rose-800 hover:to-black transition-all"
                    >
                      Retry Payment
                    </button>
                  </div>
                </div>
              ) : (
                <CashfreeCheckout
                  key={attemptKey}
                  paymentSessionId={paymentSessionId}
                  onComplete={handlePaymentComplete}
                />
              )}

              <p className="text-[10px] text-center text-stone-400">
                {paymentClosed
                  ? "Your booking will be cancelled if payment is not completed within 30 minutes."
                  : "Do not close this window while payment is in progress."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
