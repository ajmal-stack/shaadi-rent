"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { CheckDatesModal } from "./CheckDatesModal";
import { AvailabilityWindow } from "./OutfitAvailability";
import { DynamicAvailabilityCalendar } from "./DynamicAvailabilityCalendar";
import { toggleWishlist } from "@/app/actions/wishlist";
import { triggerWishlistFlyEffect } from "@/lib/utils/wishlistFlyAnimation";
import { ShareModal } from "./ShareModal";

interface OutfitActionCardProps {
  outfit: {
    id: string;
    owner_id: string;
    title: string;
    slug?: string;
    brand: string | null;
    rental_price: number;
    purchase_price: number | null;
    security_deposit: number;
    size: string | null;
    condition: string;
    city: string | null;
    state: string | null;
    categoryName?: string;
    imageUrl?: string;
  };
  availability?: AvailabilityWindow[] | null;
  initialWishlisted?: boolean;
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string) => void;
}

export function OutfitActionCard({
  outfit,
  availability = [],
  initialWishlisted = false,
  selectedDate: controlledSelectedDate,
  onSelectDate,
}: OutfitActionCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isWishlistPending, setIsWishlistPending] = useState(false);
  const [internalEventDate, setInternalEventDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const eventDate = controlledSelectedDate !== undefined ? (controlledSelectedDate ?? "") : internalEventDate;

  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const handleWishlistToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlistPending) return;

    const nextState = !isWishlisted;
    const buttonEl = e.currentTarget;

    // Optimistic state
    setIsWishlisted(nextState);
    setIsWishlistPending(true);

    // Trigger luxury parabolic flight animation to navbar heart
    if (nextState && buttonEl) {
      triggerWishlistFlyEffect(buttonEl);
    }

    try {
      const res = await toggleWishlist(outfit.id);
      if (!res.success) {
        setIsWishlisted(!nextState);

        if (res.requireAuth) {
          toast.info("Please sign in to save outfits to your wishlist.", {
            action: {
              label: "Sign in",
              onClick: () =>
                router.push(
                  `/auth/login?next=${encodeURIComponent(
                    outfit.slug ? `/outfits/${outfit.slug}` : window.location.pathname
                  )}`
                ),
            },
          });
        } else {
          toast.error(res.error || "Failed to update wishlist.");
        }
      }
      // Note: No toast message on success per user requirement
    } catch {
      setIsWishlisted(!nextState);
      toast.error("Could not update wishlist. Please try again.");
    } finally {
      setIsWishlistPending(false);
    }
  };

  // Tomorrow is the earliest selectable date (no past dates)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const savingsPercent = outfit.purchase_price
    ? Math.round(
        ((outfit.purchase_price - outfit.rental_price) / outfit.purchase_price) * 100
      )
    : null;

  // Check if a date string falls inside a blocked or maintenance window
  const checkDateAvailability = (dateStr: string) => {
    if (!dateStr) return { isAvailable: false, reason: "Please pick a date" };

    const selectedTime = new Date(dateStr).getTime();
    if (isNaN(selectedTime)) return { isAvailable: false, reason: "Invalid date" };

    if (selectedTime < new Date(tomorrowStr).getTime()) {
      return { isAvailable: false, reason: "Please select an upcoming wedding date." };
    }

    // Check 4-day rental window (delivery = event - 2 days, return = event + 1 day)
    const deliveryTime = selectedTime - 2 * 24 * 60 * 60 * 1000;
    const returnTime = selectedTime + 1 * 24 * 60 * 60 * 1000;

    const blockedList =
      availability?.filter((a) => a.status === "blocked" || a.status === "maintenance") ?? [];

    for (const b of blockedList) {
      const bStart = new Date(b.start_date).getTime();
      const bEnd = new Date(b.end_date).getTime();

      // Check overlap between [deliveryTime, returnTime] and [bStart, bEnd]
      if (deliveryTime <= bEnd && returnTime >= bStart) {
        return {
          isAvailable: false,
          reason: `This date window overlaps an existing reservation (${b.start_date} to ${b.end_date}). Please choose another date.`,
        };
      }
    }

    return { isAvailable: true, reason: "" };
  };

  const currentCheck = eventDate ? checkDateAvailability(eventDate) : null;
  const isDateValidAndAvailable = !!(eventDate && currentCheck?.isAvailable);

  // Delivery & Return strings
  let deliveryDateStr = "";
  let returnDateStr = "";
  let rentalStartDate = "";
  let rentalEndDate = "";
  if (eventDate && currentCheck?.isAvailable) {
    const d = new Date(eventDate);
    const del = new Date(d);
    del.setDate(del.getDate() - 2);
    rentalStartDate = del.toISOString().slice(0, 10);
    deliveryDateStr = del.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const ret = new Date(d);
    ret.setDate(ret.getDate() + 1);
    rentalEndDate = ret.toISOString().slice(0, 10);
    returnDateStr = ret.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const handleDateChange = (val: string) => {
    if (onSelectDate) {
      onSelectDate(val);
    } else {
      setInternalEventDate(val);
    }
    if (!val) {
      setDateError(null);
      return;
    }
    const check = checkDateAvailability(val);
    if (!check.isAvailable) {
      setDateError(check.reason);
    } else {
      setDateError(null);
    }
  };

  const handleCtaClick = () => {
    if (!eventDate) {
      setDateError("Please tap an open green date on the calendar above.");
      return;
    }

    const check = checkDateAvailability(eventDate);
    if (!check.isAvailable) {
      setDateError(check.reason);
      return;
    }

    // Date is valid and available -> Continue to Booking modal
    setIsModalOpen(true);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const formatCondition = (c: string) => {
    switch (c) {
      case "like_new":
        return "Pristine / Like New";
      case "excellent":
        return "Excellent Condition";
      default:
        return "Certified Good";
    }
  };

  return (
    <>
      <div className="sticky top-24 rounded-3xl border border-rose-100/90 bg-white p-6 sm:p-8 shadow-xl space-y-5">
        {/* Verification Pill & Actions */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>100% Certified &amp; Approved</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleWishlistToggle}
              disabled={isWishlistPending}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="rounded-full p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-50"
            >
              <Heart
                size={20}
                className={`transition-colors duration-200 ${
                  isWishlisted
                    ? "fill-rose-600 text-rose-600"
                    : "text-stone-600 hover:text-rose-600"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="rounded-full p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Brand & Title */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
            {outfit.brand || outfit.categoryName || "Designer Wedding Couture"}
          </span>

          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-stone-950 leading-tight">
            {outfit.title}
          </h1>

          {outfit.city && (
            <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
              <MapPin size={13} className="text-rose-700 shrink-0" />
              <span>
                Available in {outfit.city}
                {outfit.state ? `, ${outfit.state}` : ""}
              </span>
            </p>
          )}
        </div>

        {/* Pricing Card with exact "per rental" label */}
        <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-extrabold text-stone-950">
                ₹{outfit.rental_price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-stone-700 font-semibold">
                per rental
              </span>
              <span className="text-[11px] text-stone-400 font-normal">
                (4 days)
              </span>
            </div>

            {savingsPercent && savingsPercent > 0 && (
              <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          {outfit.purchase_price && (
            <p className="text-xs text-stone-500">
              Retail MRP Value:{" "}
              <span className="line-through font-medium">
                ₹{outfit.purchase_price.toLocaleString("en-IN")}
              </span>
            </p>
          )}

          <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-xs text-stone-600">
            <span>Refundable Security Deposit:</span>
            <span className="font-bold text-stone-900">
              {outfit.security_deposit > 0
                ? `₹${outfit.security_deposit.toLocaleString("en-IN")} (100% Refundable)`
                : "Zero Deposit"}
            </span>
          </div>
        </div>

        {/* Size & Condition Chips */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Garment Size
            </span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {outfit.size ?? "Standard Fit"}
            </span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Condition
            </span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {formatCondition(outfit.condition)}
            </span>
          </div>
        </div>

        {/* Date Selector & Live Dynamic Availability Calendar */}
        <div className="space-y-2.5 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
              Select Wedding / Event Date
            </label>
            {eventDate && (
              <button
                type="button"
                onClick={() => handleDateChange("")}
                className="text-[10px] font-bold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
              >
                Clear date
              </button>
            )}
          </div>

          {/* Live Dynamic Calendar replacing old calendar */}
          <DynamicAvailabilityCalendar
            availability={availability}
            selectedDate={eventDate}
            onSelectDate={handleDateChange}
            compact
          />

          {/* Validation Feedback */}
          {dateError && (
            <p className="flex items-start gap-1 text-[11px] font-medium text-rose-700 leading-tight">
              <AlertCircle size={13} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{dateError}</span>
            </p>
          )}

          {isDateValidAndAvailable && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-[11px] text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                <span>Wedding Date Selected &amp; Available!</span>
              </p>
              <p className="text-emerald-800/90 text-[10px]">
                Delivery: <strong className="text-emerald-950">{deliveryDateStr}</strong> &bull; Return: <strong className="text-emerald-950">{returnDateStr}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Primary CTA Button: "Select an Available Date" -> "Continue to Booking" */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCtaClick}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 sm:py-4 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
              isDateValidAndAvailable
                ? "bg-gradient-to-r from-emerald-700 via-teal-800 to-stone-900 shadow-emerald-950/20 hover:from-emerald-800 hover:to-black"
                : "bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 shadow-rose-950/15 hover:from-rose-800 hover:to-black"
            }`}
          >
            <Calendar size={18} />
            <span>
              {isDateValidAndAvailable ? "Continue to Booking" : "Select an Available Date"}
            </span>
          </button>

          {isCopied && (
            <p className="text-center text-xs font-semibold text-emerald-600">
              Link copied to clipboard!
            </p>
          )}
        </div>

        {/* Reassurance Checklist */}
        <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
            <span>100% Sanitized &amp; Hand-Inspected by ShaadiRent</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-600 shrink-0" />
            <span>Free Backup Fit or Custom Alterations Kit</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-rose-700 shrink-0" />
            <span>Delivered 48 Hours Early to Your Doorstep</span>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <CheckDatesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outfitId={outfit.id}
        ownerId={outfit.owner_id}
        outfitTitle={outfit.title}
        rentalPrice={outfit.rental_price}
        securityDeposit={outfit.security_deposit}
        selectedDate={eventDate}
        deliveryDateStr={deliveryDateStr}
        returnDateStr={returnDateStr}
        rentalStartDate={rentalStartDate}
        rentalEndDate={rentalEndDate}
      />

      {/* Social & Direct Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        outfit={{
          title: outfit.title,
          slug: outfit.slug,
          brand: outfit.brand,
          rental_price: outfit.rental_price,
          imageUrl: outfit.imageUrl,
          city: outfit.city,
          state: outfit.state,
        }}
      />
    </>
  );
}
