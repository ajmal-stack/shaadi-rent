"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
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
}: FilterInnerProps) {
  // Multi-size selection parser
  const selectedSizeList = selectedSize
    ? selectedSize.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleSize = (sz: string) => {
    let next: string[];
    if (selectedSizeList.includes(sz)) {
      next = selectedSizeList.filter((s) => s !== sz);
    } else {
      next = [...selectedSizeList, sz];
    }
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
            const isActive = selectedGender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => updateParam("gender", g.value)}
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

      {/* 2. Available on Date Filter (TASK 10.1 - FIXED: Never clipped by overflow) */}
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
              onClick={() => updatePriceTier("", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {PRICE_TIERS.map((tier) => {
            const isSelected =
              selectedMinPrice === tier.min && selectedMaxPrice === tier.max;
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => updatePriceTier(tier.min, tier.max)}
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

        {/* Custom Min / Max Inputs */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
              ₹
            </span>
            <input
              type="number"
              placeholder="Min"
              value={selectedMinPrice}
              onChange={(e) => updateParam("minPrice", e.target.value)}
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
              value={selectedMaxPrice}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
              className="w-full rounded-xl border border-stone-200 pl-6 pr-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-rose-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Sizes & Measurements Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Size &amp; Fit {selectedSizeList.length > 0 && `(${selectedSizeList.length})`}
          </label>
          {selectedSizeList.length > 0 && (
            <button
              type="button"
              onClick={() => updateParam("size", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((sz) => {
            const isSelected = selectedSizeList.includes(sz);
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
              onClick={() => updateParam("location", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Custom Location Search Input */}
        <div className="relative mb-2.5">
          <MapPin
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search city, district or state..."
            value={selectedLocation}
            onChange={(e) => updateParam("location", e.target.value)}
            className="w-full rounded-xl border border-stone-200 pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-rose-600 focus:outline-none"
          />
          {selectedLocation && (
            <button
              type="button"
              onClick={() => updateParam("location", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Popular Hub Cities Quick Chips */}
        <div className="flex flex-wrap gap-1.5">
          {combinedCities.map((loc) => {
            const isSelected = selectedLocation.toLowerCase() === loc.toLowerCase();
            return (
              <button
                key={loc}
                type="button"
                onClick={() => updateParam("location", isSelected ? "" : loc)}
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
      {hasActiveFilters && (
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
  mode = "all",
}: BrowseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(() => parseToDate(selectedEventDate));

  // Sync tempDate when selectedEventDate changes externally
  useEffect(() => {
    setTempDate(parseToDate(selectedEventDate));
  }, [selectedEventDate]);

  // Tomorrow is earliest valid event date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const updatePriceTier = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");

    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");

    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setMobileFilterOpen(false);
    setCalendarModalOpen(false);
  };

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
          className={`lg:hidden flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
            activeFilterCount > 0
              ? "border-rose-300 bg-rose-50 text-rose-900 font-bold"
              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          }`}
          aria-label="Open filter options"
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-900 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile Slide-up Bottom Sheet / Drawer ── */}
      {showMobile && mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center lg:hidden"
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 pb-safe">
            {/* Sheet Handle */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-stone-200 mb-4" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-rose-900" />
                <span className="font-display text-lg font-bold text-stone-900">
                  Filter Outfits
                </span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-900 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <FilterInner {...innerProps} />

            {/* Apply & Close Button */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 rounded-xl border border-stone-200 py-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-rose-900 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-950 transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unclipped Event Date Selection Modal (fixed overlay: NEVER clipped by overflow) ── */}
      {calendarModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            onClick={() => setCalendarModalOpen(false)}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl z-10 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
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

            {/* Calendar */}
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
            <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 text-[11px] text-amber-900 leading-relaxed">
              <p className="font-semibold text-amber-950">
                Standard 4-Day Rental Window:
              </p>
              <p className="text-stone-600 mt-0.5">
                Delivered <strong>2 days before</strong> wedding for trials &amp; returned <strong>1 day after</strong> event.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2.5">
              {tempDate && (
                <button
                  type="button"
                  onClick={() => {
                    setTempDate(null);
                    updateParam("eventDate", "");
                    setCalendarModalOpen(false);
                  }}
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
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
        </div>
      )}
    </>
  );
}
