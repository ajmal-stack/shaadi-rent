"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  gender_type: string;
}

interface BrowseFiltersProps {
  categories?: CategoryOption[];
  selectedCategory?: string;
  selectedGender?: string;
  selectedMinPrice?: string;
  selectedMaxPrice?: string;
  selectedSize?: string;
  selectedLocation?: string;
  selectedEventDate?: string;
  availableCities?: string[];
  searchQuery?: string;
  totalOutfits?: number;
  mode?: "all" | "desktop" | "mobile";
}

const GENDERS = [
  { value: "all", label: "All" },
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
];

const PRICE_TIERS = [
  { label: "All Prices", min: "", max: "" },
  { label: "Under ₹3,000", min: "", max: "3000" },
  { label: "₹3,000 – ₹7,000", min: "3000", max: "7000" },
  { label: "₹7,000 – ₹15,000", min: "7000", max: "15000" },
  { label: "Above ₹15,000", min: "15000", max: "" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom"];

const DEFAULT_POPULAR_LOCATIONS = [
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Jaipur",
  "Hyderabad",
  "Chandigarh",
  "Kolkata",
  "Lucknow",
];

function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function parseToDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const parts = val.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface FilterInnerProps {
  updateParam: (key: string, value: string) => void;
  updatePriceTier: (min: string, max: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  selectedGender: string;
  selectedMinPrice: string;
  selectedMaxPrice: string;
  selectedSize: string;
  selectedLocation: string;
  selectedEventDate: string;
  availableCities: string[];
  openCalendarModal: () => void;
  hideClearButton?: boolean;
}

function FilterInner({
  updateParam,
  updatePriceTier,
  clearAllFilters,
  hasActiveFilters,
  selectedGender,
  selectedMinPrice,
  selectedMaxPrice,
  selectedSize,
  selectedLocation,
  selectedEventDate,
  availableCities,
  openCalendarModal,
  hideClearButton = false,
}: FilterInnerProps) {
  // Local state for debounced text inputs to prevent router action spam
  const [localLocation, setLocalLocation] = useState(selectedLocation);
  const [localMinPrice, setLocalMinPrice] = useState(selectedMinPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(selectedMaxPrice);

  const isLocationDirty = useRef(false);
  const isPriceDirty = useRef(false);

  // Sync local inputs when props change externally (e.g. badge removed or URL changed)
  useEffect(() => {
    if (!isLocationDirty.current) {
      setLocalLocation(selectedLocation);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (!isPriceDirty.current) {
      setLocalMinPrice(selectedMinPrice);
      setLocalMaxPrice(selectedMaxPrice);
    }
  }, [selectedMinPrice, selectedMaxPrice]);

  // Debounced location update ONLY when dirty (user typed)
  useEffect(() => {
    if (!isLocationDirty.current) return;
    const timer = setTimeout(() => {
      isLocationDirty.current = false;
      updateParam("location", localLocation.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [localLocation, updateParam]);

  // Debounced price tier update ONLY when dirty (user typed)
  useEffect(() => {
    if (!isPriceDirty.current) return;
    const timer = setTimeout(() => {
      isPriceDirty.current = false;
      updatePriceTier(localMinPrice, localMaxPrice);
    }, 350);
    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice, updatePriceTier]);

  // Multi-size and gender optimistic states for instant visual feedback
  const [localGender, setLocalGender] = useState(selectedGender);
  const [localSizes, setLocalSizes] = useState<string[]>(() =>
    selectedSize ? selectedSize.split(",").map((s) => s.trim()).filter(Boolean) : []
  );

  useEffect(() => {
    setLocalGender(selectedGender);
  }, [selectedGender]);

  useEffect(() => {
    setLocalSizes(
      selectedSize ? selectedSize.split(",").map((s) => s.trim()).filter(Boolean) : []
    );
  }, [selectedSize]);

  const toggleSize = (sz: string) => {
    let next: string[];
    if (localSizes.includes(sz)) {
      next = localSizes.filter((s) => s !== sz);
    } else {
      next = [...localSizes, sz];
    }
    setLocalSizes(next); // INSTANT 0ms visual feedback
    updateParam("size", next.join(","));
  };

  // Combine default hub cities with any dynamic cities from DB
  const combinedCities = Array.from(
    new Set([...DEFAULT_POPULAR_LOCATIONS, ...availableCities])
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 1. Wearer / Gender Selection */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
          Wearer / Gender
        </label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-100 p-1">
          {GENDERS.map((g) => {
            const isActive = localGender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setLocalGender(g.value); // INSTANT 0ms visual feedback
                  updateParam("gender", g.value);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-rose-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Available on Date Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Available on Event Date
          </label>
          {selectedEventDate && (
            <button
              type="button"
              onClick={() => updateParam("eventDate", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Date Trigger Card that opens unclipped Calendar Modal */}
        <button
          type="button"
          onClick={openCalendarModal}
          className={`w-full flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs transition-all border cursor-pointer ${
            selectedEventDate
              ? "border-rose-300 bg-rose-50/90 text-rose-950 font-bold shadow-2xs"
              : "border-stone-200/90 bg-stone-50/90 text-stone-700 hover:border-rose-200 hover:bg-white"
          }`}
          aria-label="Select event date"
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon size={16} className="shrink-0 text-rose-700" />
            <span className="truncate">
              {selectedEventDate ? formatDisplayDate(selectedEventDate) : "Select wedding date"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedEventDate && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  updateParam("eventDate", "");
                }}
                className="p-1 rounded-md text-stone-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
                title="Clear date"
              >
                <X size={13} />
              </span>
            )}
            <ChevronDown size={14} className="text-stone-400" />
          </div>
        </button>

        <p className="mt-1.5 text-[11px] text-stone-500 leading-tight">
          Filters outfits free from reservation conflicts for 4-day rental window (delivery 2 days prior to wedding, return 1 day after).
        </p>
      </div>

      {/* 3. Rental Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Rental Price
          </label>
          {(selectedMinPrice || selectedMaxPrice) && (
            <button
              type="button"
              onClick={() => {
                isPriceDirty.current = false;
                setLocalMinPrice("");
                setLocalMaxPrice("");
                updatePriceTier("", "");
              }}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {PRICE_TIERS.map((tier) => {
            const isSelected =
              (tier.min === "" && tier.max === "" && !localMinPrice && !localMaxPrice) ||
              (localMinPrice === tier.min && localMaxPrice === tier.max);
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => {
                  isPriceDirty.current = false;
                  setLocalMinPrice(tier.min);
                  setLocalMaxPrice(tier.max);
                  updatePriceTier(tier.min, tier.max);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-rose-50 font-semibold text-rose-950 border border-rose-200"
                    : "text-stone-600 hover:bg-stone-50 border border-transparent"
                }`}
              >
                <span>{tier.label}</span>
                {isSelected && (
                  <Check size={14} className="text-rose-800 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs with local state */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
              ₹
            </span>
            <input
              type="number"
              placeholder="Min"
              value={localMinPrice}
              onChange={(e) => {
                isPriceDirty.current = true;
                setLocalMinPrice(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  isPriceDirty.current = false;
                  updatePriceTier(localMinPrice, localMaxPrice);
                }
              }}
              className="w-full rounded-xl border border-stone-200 pl-6 pr-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-rose-600 focus:outline-none"
            />
          </div>
          <span className="text-stone-400 text-xs">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
              ₹
            </span>
            <input
              type="number"
              placeholder="Max"
              value={localMaxPrice}
              onChange={(e) => {
                isPriceDirty.current = true;
                setLocalMaxPrice(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  isPriceDirty.current = false;
                  updatePriceTier(localMinPrice, localMaxPrice);
                }
              }}
              className="w-full rounded-xl border border-stone-200 pl-6 pr-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-rose-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Sizes & Measurements Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Size &amp; Fit {localSizes.length > 0 && `(${localSizes.length})`}
          </label>
          {localSizes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setLocalSizes([]);
                updateParam("size", "");
              }}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((sz) => {
            const isSelected = localSizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border cursor-pointer ${
                  isSelected
                    ? "border-rose-800 bg-rose-900 text-white shadow-2xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-stone-400">
          Select one or multiple sizes. Free size fits most with complimentary alteration.
        </p>
      </div>

      {/* 5. City / Location Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            City / Location
          </label>
          {selectedLocation && (
            <button
              type="button"
              onClick={() => {
                isLocationDirty.current = false;
                setLocalLocation("");
                updateParam("location", "");
              }}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Custom Location Search Input with debouncing */}
        <div className="relative mb-2.5">
          <MapPin
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search city, district or state..."
            value={localLocation}
            onChange={(e) => {
              isLocationDirty.current = true;
              setLocalLocation(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                isLocationDirty.current = false;
                updateParam("location", localLocation.trim());
              }
            }}
            className="w-full rounded-xl border border-stone-200 pl-8 pr-8 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-rose-600 focus:outline-none"
          />
          {localLocation && (
            <button
              type="button"
              onClick={() => {
                isLocationDirty.current = false;
                setLocalLocation("");
                updateParam("location", "");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              title="Clear input"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Popular Hub Cities Quick Chips */}
        <div className="flex flex-wrap gap-1.5">
          {combinedCities.map((loc) => {
            const isSelected = localLocation.toLowerCase() === loc.toLowerCase();
            return (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  isLocationDirty.current = false;
                  const nextLoc = isSelected ? "" : loc;
                  setLocalLocation(nextLoc);
                  updateParam("location", nextLoc);
                }}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? "border-rose-800 bg-rose-50 text-rose-900 font-semibold shadow-2xs"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                <MapPin size={10} className={isSelected ? "text-rose-700" : "text-stone-400"} />
                <span>{loc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Clear All Filters CTA */}
      {!hideClearButton && hasActiveFilters && (
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function BrowseFilters({
  selectedCategory = "",
  selectedGender = "all",
  selectedMinPrice = "",
  selectedMaxPrice = "",
  selectedSize = "",
  selectedLocation = "",
  selectedEventDate = "",
  availableCities = [],
  searchQuery = "",
  totalOutfits,
  mode = "all",
}: BrowseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(() => parseToDate(selectedEventDate));

  // Sync tempDate when selectedEventDate changes externally
  useEffect(() => {
    setTempDate(parseToDate(selectedEventDate));
  }, [selectedEventDate]);

  // Prevent background scroll when mobile filter drawer or calendar modal is open
  useEffect(() => {
    if (mobileFilterOpen || calendarModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileFilterOpen, calendarModalOpen]);

  const [mounted, setMounted] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    setMounted(true);
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Tomorrow is earliest valid event date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const updateParam = useCallback(
    (key: string, value: string) => {
      if (!isMounted.current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const updatePriceTier = useCallback(
    (min: string, max: string) => {
      if (!isMounted.current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (min) params.set("minPrice", min);
      else params.delete("minPrice");

      if (max) params.set("maxPrice", max);
      else params.delete("maxPrice");

      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    if (!isMounted.current) return;
    router.push(pathname, { scroll: false });
    setMobileFilterOpen(false);
    setCalendarModalOpen(false);
  }, [pathname, router]);

  // Count active filters
  let activeFilterCount = 0;
  if (selectedCategory) activeFilterCount++;
  if (selectedGender && selectedGender !== "all") activeFilterCount++;
  if (selectedMinPrice || selectedMaxPrice) activeFilterCount++;
  if (selectedSize) {
    const sizeCount = selectedSize.split(",").map((s) => s.trim()).filter(Boolean).length;
    activeFilterCount += sizeCount;
  }
  if (selectedLocation) activeFilterCount++;
  if (selectedEventDate) activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0 || Boolean(searchQuery);

  const innerProps: FilterInnerProps = {
    updateParam,
    updatePriceTier,
    clearAllFilters,
    hasActiveFilters,
    selectedGender,
    selectedMinPrice,
    selectedMaxPrice,
    selectedSize,
    selectedLocation,
    selectedEventDate,
    availableCities,
    openCalendarModal: () => setCalendarModalOpen(true),
  };

  const showDesktop = mode === "all" || mode === "desktop";
  const showMobile = mode === "all" || mode === "mobile";

  return (
    <>
      {/* ── Desktop Left Sidebar View (Sticky on scroll) ── */}
      {showDesktop && (
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start z-10">
          <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-rose-100/80 bg-white p-6 shadow-2xs no-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-rose-900" />
                <span className="font-display text-base font-bold text-stone-900">
                  Filters
                </span>
                {isPending && (
                  <Loader2 size={13} className="animate-spin text-rose-800" />
                )}
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-900 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-rose-800 hover:underline font-medium cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            <FilterInner {...innerProps} />
          </div>
        </aside>
      )}

      {/* ── Mobile Filter Trigger Button ── */}
      {showMobile && (
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className={`lg:hidden flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeFilterCount > 0
              ? "border-rose-300 bg-rose-50 text-rose-900 font-bold shadow-2xs"
              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 shadow-2xs"
          }`}
          aria-label="Open filter options"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin text-rose-800" />
          ) : (
            <SlidersHorizontal
              size={14}
              className={activeFilterCount > 0 ? "text-rose-800" : "text-stone-500"}
            />
          )}
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-900 text-[10px] font-bold text-white shadow-2xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile Slide-up Bottom Sheet / Drawer (Portaled to document.body) ── */}
      {showMobile &&
        mobileFilterOpen &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden"
          >
            {/* Backdrop with click to dismiss */}
            <div
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Drawer Sheet Container */}
            <div className="relative w-full max-h-[88vh] flex flex-col rounded-t-[2rem] bg-white shadow-2xl z-10 animate-in slide-in-from-bottom duration-250">
              {/* 1. Fixed Sticky Header */}
              <div className="shrink-0 px-6 pt-3.5 pb-4 border-b border-stone-100">
                {/* Drag Handle */}
                <div className="mx-auto w-12 h-1 rounded-full bg-stone-300 mb-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
                      <SlidersHorizontal size={15} />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-bold text-stone-900 leading-tight">
                        Filter Outfits
                      </h2>
                      <p className="text-[11px] text-stone-500 leading-tight">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} active ${activeFilterCount === 1 ? "filter" : "filters"}`
                          : "Refine your wedding collection"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs text-rose-800 hover:text-rose-950 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMobileFilterOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      aria-label="Close filters"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain">
                <FilterInner {...innerProps} hideClearButton={true} />
              </div>

              {/* 3. Fixed Sticky Footer Action Bar */}
              <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-white/98 backdrop-blur-md flex items-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex-1 rounded-2xl border border-stone-200 py-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className={`rounded-2xl bg-rose-900 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-950 active:scale-[0.98] transition-all cursor-pointer text-center ${
                    hasActiveFilters ? "flex-[2]" : "w-full"
                  }`}
                >
                  {isPending ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Updating Outfits...</span>
                    </span>
                  ) : totalOutfits !== undefined ? (
                    `Show ${totalOutfits} ${totalOutfits === 1 ? "Outfit" : "Outfits"}`
                  ) : (
                    "Apply Filters"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Unclipped Event Date Selection Modal (Portaled to document.body) ── */}
      {calendarModalOpen &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
          >
            {/* Backdrop */}
            <div
              onClick={() => setCalendarModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-sm max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl z-10 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
              {/* Modal Header */}
              <div className="shrink-0 px-5 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                      Select Event Date
                    </h3>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Check rental availability
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                  aria-label="Close date picker"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Calendar Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 overscroll-contain">
                <div className="flex justify-center">
                  <CustomCalendar
                    mode="single"
                    selected={tempDate}
                    onSelect={(d) => setTempDate(d)}
                    minDate={tomorrow}
                    className="border-0 shadow-none p-0 w-full"
                  />
                </div>

                {/* Rental Window Info Banner */}
                <div className="mt-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-semibold text-amber-950">
                    Standard 4-Day Rental Window:
                  </p>
                  <p className="text-stone-600 mt-0.5">
                    Delivered <strong>2 days before</strong> wedding &amp; returned <strong>1 day after</strong> event.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-stone-100 bg-stone-50/50 flex items-center gap-2.5">
                {tempDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempDate(null);
                      updateParam("eventDate", "");
                      setCalendarModalOpen(false);
                    }}
                    className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
                <button
                  type="button"
                  disabled={!tempDate}
                  onClick={() => {
                    if (tempDate) {
                      updateParam("eventDate", toISODateString(tempDate));
                    }
                    setCalendarModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-rose-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-950 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Apply Date Filter
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
