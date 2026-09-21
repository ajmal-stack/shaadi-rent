"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  MapPin,
  Calendar as CalendarIcon,
} from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

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
}: FilterInnerProps) {
  // Tomorrow is earliest valid event date for rental booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

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
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
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

      {/* 2. Available on Date Filter (TASK 10.1) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Available on Event Date
          </label>
          {selectedEventDate && (
            <button
              type="button"
              onClick={() => updateParam("eventDate", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        <DatePicker
          value={selectedEventDate}
          onChange={(val) => updateParam("eventDate", val)}
          minDate={tomorrow}
          placeholder="Select wedding date"
          className="w-full text-xs"
        />

        <p className="mt-1.5 text-[11px] text-stone-500 leading-tight">
          Filters outfits free from reservation conflicts for standard 4-day rental window (delivery 2 days before event, return 1 day after).
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
              className="text-[10px] text-rose-800 hover:underline font-semibold"
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
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
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

      {/* 4. Sizes & Measurements Filter (TASK 10.2) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Size &amp; Fit {selectedSizeList.length > 0 && `(${selectedSizeList.length})`}
          </label>
          {selectedSizeList.length > 0 && (
            <button
              type="button"
              onClick={() => updateParam("size", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold"
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

      {/* 5. City / Location Filter (TASK 10.3) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            City / Location
          </label>
          {selectedLocation && (
            <button
              type="button"
              onClick={() => updateParam("location", "")}
              className="text-[10px] text-rose-800 hover:underline font-semibold"
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
  };

  // Count active filters (TASK 10.4)
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
  };

  const showDesktop = mode === "all" || mode === "desktop";
  const showMobile = mode === "all" || mode === "mobile";

  return (
    <>
      {/* ── Desktop Left Sidebar View (Sticky on scroll) ── */}
      {showDesktop && (
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start z-10">
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
    </>
  );
}
