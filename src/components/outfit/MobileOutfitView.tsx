"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Share2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Package,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Ruler,
  Scissors,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/DatePicker";
import { CheckDatesModal } from "./CheckDatesModal";
import { ShareModal } from "./ShareModal";
import { AvailabilityWindow } from "./OutfitAvailability";
import { MeasurementsData } from "./OutfitMeasurements";
import { OutfitCardData, OutfitCard } from "@/components/browse/OutfitCard";
import { getOutfitImageUrl } from "@/lib/utils/image";
import { toggleWishlist } from "@/app/actions/wishlist";
import { triggerWishlistFlyEffect } from "@/lib/utils/wishlistFlyAnimation";

export interface MobileOutfitViewProps {
  outfit: {
    id: string;
    owner_id: string;
    title: string;
    slug: string;
    description: string | null;
    brand: string | null;
    purchase_price: number | null;
    rental_price: number;
    security_deposit: number;
    size: string | null;
    condition: string;
    color: string | null;
    city: string | null;
    state: string | null;
    district: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
      gender_type: string;
    } | null;
    images?: Array<{
      id: string;
      storage_path: string;
      image_type: string;
      sort_order: number;
    }> | null;
    measurements?: MeasurementsData | null;
  };
  availability?: AvailabilityWindow[] | null;
  initialWishlisted?: boolean;
  similarOutfits?: OutfitCardData[];
  wishlistedIds?: string[];
}

export function MobileOutfitView({
  outfit,
  availability = [],
  initialWishlisted = false,
  similarOutfits = [],
  wishlistedIds = [],
}: MobileOutfitViewProps) {
  const router = useRouter();

  // ── Gallery State ──
  const sortedImages = (outfit.images || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // ── Modals & Actions ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isWishlistPending, setIsWishlistPending] = useState(false);

  // ── Accordion States ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    story: true,
    measurements: false,
    timeline: false,
    partner: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Date Selection & Availability ──
  const [eventDate, setEventDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const dateSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  // Tomorrow is earliest selectable date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const savingsPercent = outfit.purchase_price
    ? Math.round(
        ((outfit.purchase_price - outfit.rental_price) / outfit.purchase_price) * 100
      )
    : null;

  const formatAngleLabel = (type: string) => {
    switch (type) {
      case "front":
        return "Front View";
      case "back":
        return "Back View";
      case "detail":
        return "Embroidery Detail";
      case "side":
        return "Side Profile";
      case "label":
        return "Designer Label";
      default:
        return "Couture View";
    }
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

  // Check date collision with blocked/maintenance windows
  const checkDateAvailability = (dateStr: string) => {
    if (!dateStr) return { isAvailable: false, reason: "Please pick a date" };
    const selectedTime = new Date(dateStr).getTime();
    if (isNaN(selectedTime)) return { isAvailable: false, reason: "Invalid date" };

    if (selectedTime < new Date(tomorrowStr).getTime()) {
      return { isAvailable: false, reason: "Please select an upcoming wedding date." };
    }

    const deliveryTime = selectedTime - 2 * 24 * 60 * 60 * 1000;
    const returnTime = selectedTime + 1 * 24 * 60 * 60 * 1000;

    const blockedList =
      availability?.filter((a) => a.status === "blocked" || a.status === "maintenance") ?? [];

    for (const b of blockedList) {
      const bStart = new Date(b.start_date).getTime();
      const bEnd = new Date(b.end_date).getTime();
      if (deliveryTime <= bEnd && returnTime >= bStart) {
        return {
          isAvailable: false,
          reason: `Reserved (${b.start_date} to ${b.end_date}). Please choose another date.`,
        };
      }
    }

    return { isAvailable: true, reason: "" };
  };

  const currentCheck = eventDate ? checkDateAvailability(eventDate) : null;
  const isDateValidAndAvailable = !!(eventDate && currentCheck?.isAvailable);

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
    setEventDate(val);
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

  const handleWishlistToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlistPending) return;

    const nextState = !isWishlisted;
    const buttonEl = e.currentTarget;

    setIsWishlisted(nextState);
    setIsWishlistPending(true);

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
              onClick: () => router.push(`/auth/login?next=/outfits/${outfit.slug}`),
            },
          });
        }
      }
    } catch {
      setIsWishlisted(!nextState);
    } finally {
      setIsWishlistPending(false);
    }
  };

  // Primary Action in sticky bar
  const handleBookingAction = () => {
    if (!eventDate || !isDateValidAndAvailable) {
      // Smooth scroll to the date selection card
      dateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setDateError("Please select your wedding date first.");
      return;
    }

    setIsModalOpen(true);
  };

  // Gallery Swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 40;

    if (diff > threshold) {
      setActiveImageIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
    } else if (diff < -threshold) {
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
    }
    touchStartX.current = null;
  };

  const currentImage = sortedImages[activeImageIndex];
  const primaryImageUrl = currentImage
    ? getOutfitImageUrl(currentImage.storage_path)
    : getOutfitImageUrl(null);

  const measurements = outfit.measurements;

  return (
    <div className="min-h-screen bg-stone-50/50 pb-36 text-gray-900 font-sans">
      {/* ── 1. TOP APP BAR ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-2xs">
        <Link
          href="/browse"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 rounded-full bg-stone-100/80 px-3 py-1.5 active:scale-95 transition-all"
        >
          <ArrowLeft size={14} />
          <span>Browse</span>
        </Link>

        {outfit.category && (
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
            {outfit.category.name}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={isWishlistPending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 active:scale-90 transition-all cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              size={16}
              className={isWishlisted ? "fill-rose-600 text-rose-600" : "text-stone-700"}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 active:scale-90 transition-all cursor-pointer"
            aria-label="Share"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4 max-w-md mx-auto">
        {/* ── 2. HERO IMAGE GALLERY (Touch Swipeable) ───────────────────────── */}
        <div className="space-y-2.5">
          <div
            className="group relative aspect-[3/4] w-full select-none rounded-3xl overflow-hidden bg-stone-100 border border-rose-100/90 shadow-md touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={primaryImageUrl}
              alt={outfit.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-300"
            />

            {/* Top Verification Shield Pill */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-emerald-900 border border-emerald-200/80 shadow-xs">
              <ShieldCheck size={12} className="text-emerald-700" />
              <span>Certified Couture</span>
            </div>

            {/* Bottom Angle View Pill */}
            {currentImage?.image_type && (
              <div className="absolute bottom-3 left-3 rounded-full bg-stone-950/75 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
                {formatAngleLabel(currentImage.image_type)}
              </div>
            )}

            {/* Bottom Pagination Dots/Badge */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-stone-950/75 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
                {activeImageIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {sortedImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {sortedImages.map((img, idx) => {
                const isSelected = idx === activeImageIndex;
                const thumbUrl = getOutfitImageUrl(img.storage_path);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-14 w-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      isSelected
                        ? "border-rose-900 ring-2 ring-rose-200 scale-95"
                        : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={thumbUrl}
                      alt={`${outfit.title} angle ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 3. GARMENT IDENTITY & VALUE CARD ──────────────────────────────── */}
        <div className="rounded-3xl bg-white p-4.5 border border-rose-100/90 shadow-2xs space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                {outfit.brand || outfit.category?.name || "Designer Wedding Couture"}
              </span>

              {outfit.city && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <MapPin size={11} className="text-rose-700 shrink-0" />
                  <span>{outfit.city}</span>
                </span>
              )}
            </div>

            <h1 className="font-display text-xl font-bold text-gray-900 leading-tight mt-1">
              {outfit.title}
            </h1>
          </div>

          {/* Pricing Strip */}
          <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-3.5 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-950 font-display">
                  ₹{outfit.rental_price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-stone-700 font-semibold">per rental</span>
                <span className="text-[10px] text-stone-400">(4 days)</span>
              </div>

              {savingsPercent && savingsPercent > 0 && (
                <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  Save {savingsPercent}%
                </span>
              )}
            </div>

            {outfit.purchase_price && (
              <p className="text-[11px] text-stone-500">
                Retail Value:{" "}
                <span className="line-through font-medium">
                  ₹{outfit.purchase_price.toLocaleString("en-IN")}
                </span>
              </p>
            )}

            <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-stone-600">
              <span>Security Deposit:</span>
              <span className="font-bold text-stone-900">
                {outfit.security_deposit > 0
                  ? `₹${outfit.security_deposit.toLocaleString("en-IN")} (100% Refundable)`
                  : "Zero Deposit"}
              </span>
            </div>
          </div>

          {/* Quick Fit & Attribute Chips */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-[9px] uppercase font-bold text-stone-400 block">Garment Size</span>
              <span className="font-bold text-stone-900 mt-0.5 block">{outfit.size ?? "Standard Fit"}</span>
            </div>

            <div className="rounded-2xl bg-stone-50 p-2.5 border border-stone-100">
              <span className="text-[9px] uppercase font-bold text-stone-400 block">Condition</span>
              <span className="font-bold text-stone-900 mt-0.5 block">{formatCondition(outfit.condition)}</span>
            </div>

            {outfit.color && (
              <div className="rounded-2xl bg-stone-50 p-2.5 border border-stone-100">
                <span className="text-[9px] uppercase font-bold text-stone-400 block">Couture Color</span>
                <span className="font-bold text-stone-900 mt-0.5 block">{outfit.color}</span>
              </div>
            )}

            {outfit.category?.gender_type && (
              <div className="rounded-2xl bg-stone-50 p-2.5 border border-stone-100">
                <span className="text-[9px] uppercase font-bold text-stone-400 block">Occasion</span>
                <span className="font-bold text-stone-900 mt-0.5 block capitalize">
                  {outfit.category.gender_type} Wear
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 4. DATE PICKER & AVAILABILITY CARD (Inline) ───────────────────── */}
        <div
          ref={dateSectionRef}
          className="rounded-3xl bg-white p-4.5 border border-rose-100/90 shadow-2xs space-y-2.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-800">
            <Calendar size={14} className="text-rose-800" />
            <span>Select Wedding / Event Date</span>
          </div>

          <DatePicker
            value={eventDate}
            onChange={handleDateChange}
            placeholder="Choose Wedding / Event Date"
            minDate={tomorrow}
            showPresets
            error={dateError || undefined}
          />

          {dateError && (
            <p className="flex items-start gap-1 text-[11px] font-medium text-rose-700 leading-tight">
              <AlertCircle size={13} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{dateError}</span>
            </p>
          )}

          {isDateValidAndAvailable && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                <span>Reserved for Your Wedding!</span>
              </p>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                Delivery: <strong>{deliveryDateStr}</strong> &bull; Return Pickup: <strong>{returnDateStr}</strong>
              </p>
            </div>
          )}

          {/* Free Hygiene & Delivery Guarantee */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Truck size={12} className="text-rose-700 shrink-0" />
              Delivered 48 hrs early
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-700 shrink-0" />
              100% Sanitized &amp; Inspected
            </span>
          </div>
        </div>

        {/* ── 5. ACCORDION DRAWERS (Story, Measurements, Rental Window, Quality Shield) */}
        <div className="rounded-3xl bg-white border border-rose-100/90 shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {/* Drawer 1: Design & Craftsmanship */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("story")}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-600" />
                <span>Design &amp; Craftsmanship</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  openSections.story ? "rotate-180 text-rose-800" : ""
                }`}
              />
            </button>

            {openSections.story && (
              <div className="px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-50">
                {outfit.description ||
                  "Handcrafted with exquisite attention to detail. Featuring traditional zardozi embroidery and royal motifs on premium bridal fabric. Hand-tailored for wedding celebrations, pheras, and grand reception evenings."}
              </div>
            )}
          </div>

          {/* Drawer 2: Exact Measurements & Fit */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("measurements")}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Ruler size={14} className="text-rose-700" />
                <span>Measurements &amp; Fit Guide</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  openSections.measurements ? "rotate-180 text-rose-800" : ""
                }`}
              />
            </button>

            {openSections.measurements && (
              <div className="px-4 pb-4 pt-2 text-xs text-gray-600 space-y-3 border-t border-gray-50">
                {measurements ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {measurements.bust && (
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">Bust / Chest</span>
                        <span className="font-bold text-gray-900">{measurements.bust}&quot;</span>
                      </div>
                    )}
                    {measurements.waist && (
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">Waist</span>
                        <span className="font-bold text-gray-900">{measurements.waist}&quot;</span>
                      </div>
                    )}
                    {measurements.hip && (
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">Hips</span>
                        <span className="font-bold text-gray-900">{measurements.hip}&quot;</span>
                      </div>
                    )}
                    {measurements.length && (
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">Length</span>
                        <span className="font-bold text-gray-900">{measurements.length}&quot;</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Standard Size {outfit.size ?? "Free Size"}. Fits true to Indian couture sizing.
                  </p>
                )}

                <div className="rounded-2xl bg-amber-50/80 p-3 border border-amber-200/70 text-[11px] text-amber-950 flex items-start gap-2">
                  <Scissors size={14} className="text-amber-800 shrink-0 mt-0.5" />
                  <p>
                    Every rental includes our <strong>Complimentary Fit Assist Kit</strong> (temporary stitch tape &amp; micro-adjust pins) with zero garment damage.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawer 3: 4-Day Rental Window Timeline */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("timeline")}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-700" />
                <span>4-Day Rental Timeline</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  openSections.timeline ? "rotate-180 text-rose-800" : ""
                }`}
              />
            </button>

            {openSections.timeline && (
              <div className="px-4 pb-4 pt-2 text-xs text-gray-600 space-y-2.5 border-t border-gray-50">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-gray-900 text-xs">Day 1: Sanitized Arrival</strong>
                    <p className="text-[11px] text-gray-500">Delivered 48 hours prior to your wedding day for complete peace of mind.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-gray-900 text-xs">Day 2 &amp; 3: Celebrations</strong>
                    <p className="text-[11px] text-gray-500">Wear and shine at your sangeet, wedding ceremony, and reception.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-gray-900 text-xs">Day 4: Free Courier Pickup</strong>
                    <p className="text-[11px] text-gray-500">Pack in the provided garment bag. Courier picks it up right from your doorstep.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer 4: Verified Boutique Partner & Quality Shield */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("partner")}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Package size={14} className="text-teal-700" />
                <span>Verified Partner &amp; Quality Shield</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  openSections.partner ? "rotate-180 text-rose-800" : ""
                }`}
              />
            </button>

            {openSections.partner && (
              <div className="px-4 pb-4 pt-2 text-xs text-gray-600 space-y-2 border-t border-gray-50">
                <p>
                  Curated by a verified boutique partner in{" "}
                  <strong className="text-gray-900">
                    {outfit.city ? `${outfit.city}, ${outfit.state || "India"}` : "Pan-India Hub"}
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Every garment undergoes steam sanitization, thread verification, and insured packing before dispatch.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 6. SIMILAR OUTFITS CAROUSEL ──────────────────────────────────── */}
        {similarOutfits.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-gray-900">
                You May Also Adore
              </h2>
              {outfit.category && (
                <Link
                  href={`/browse?category=${outfit.category.slug}`}
                  className="text-xs font-semibold text-rose-900 hover:underline"
                >
                  View All
                </Link>
              )}
            </div>

            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none">
              {similarOutfits.map((s) => (
                <div key={s.id} className="w-56 shrink-0">
                  <OutfitCard
                    outfit={s}
                    initialWishlisted={wishlistedIds.includes(s.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 7. DEDICATED STICKY MOBILE BOOKING ACTION BAR ──────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden bg-white/95 backdrop-blur-md border-t border-rose-100/90 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Price & Deposit Details */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-bold text-gray-950">
                ₹{outfit.rental_price.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">/ 4 days</span>
            </div>
            <p className="text-[10px] text-emerald-800 font-medium">
              {outfit.security_deposit > 0
                ? `+₹${outfit.security_deposit} refundable deposit`
                : "Zero deposit required"}
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleBookingAction}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
              isDateValidAndAvailable
                ? "bg-gradient-to-r from-emerald-700 to-teal-900 shadow-emerald-900/20"
                : "bg-gradient-to-r from-rose-800 to-rose-950 shadow-rose-950/20"
            }`}
          >
            <Calendar size={15} />
            <span>
              {isDateValidAndAvailable ? "Continue to Booking" : "Select Wedding Date"}
            </span>
          </button>
        </div>
      </div>

      {/* ── 8. MODALS ──────────────────────────────────────────────────────── */}
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        outfit={{
          title: outfit.title,
          slug: outfit.slug,
          brand: outfit.brand,
          rental_price: outfit.rental_price,
          imageUrl: primaryImageUrl,
          city: outfit.city,
          state: outfit.state,
        }}
      />
    </div>
  );
}
