"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

interface BrowseSortProps {
  currentSort?: string;
}

interface SortOption {
  value: string;
  label: string;
  description?: string;
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: "recommended",
    label: "Recommended",
    description: "Curated wedding picks",
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
    description: "Budget-friendly first",
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
    description: "Luxury couture first",
  },
  {
    value: "newest",
    label: "Newest",
    description: "Latest season arrivals",
  },
];

export function BrowseSort({ currentSort = "recommended" }: BrowseSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === currentSort) || SORT_OPTIONS[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSelect = (newSort: string) => {
    if (!isMounted.current) return;
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    params.delete("page"); // reset to page 1 on sort change
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ── Custom Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort options, currently sorted by ${selectedOption.label}`}
        className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-800/20 ${
          isOpen
            ? "border-rose-300 bg-rose-50/50 text-rose-950 shadow-xs"
            : "border-stone-200/90 bg-white text-stone-800 shadow-2xs hover:border-rose-200 hover:bg-stone-50/70"
        }`}
      >
        <ArrowUpDown
          size={13}
          className={`shrink-0 transition-colors ${
            isOpen ? "text-rose-800" : "text-stone-400 group-hover:text-stone-600"
          }`}
        />

        <span className="text-stone-500 font-normal hidden sm:inline">
          Sort by:
        </span>

        <span className="font-semibold text-stone-900 truncate max-w-[130px] sm:max-w-none">
          {selectedOption.label}
        </span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-rose-800" : "group-hover:text-stone-600"
          }`}
        />
      </button>

      {/* ── Custom Floating Menu ── */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort options"
          className="absolute right-0 top-full mt-2 w-56 sm:w-64 rounded-2xl border border-rose-100/90 bg-white/98 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-stone-900/5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-y-auto max-h-[380px] sleek-scrollbar"
        >
          {/* Header Label inside dropdown */}
          <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Sort Outfits
            </p>
          </div>

          <div className="space-y-0.5">
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.value === currentSort;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 ${
                    isSelected
                      ? "bg-rose-50/80 font-bold text-rose-950 border border-rose-100"
                      : "text-stone-700 hover:bg-stone-50 hover:text-stone-950 border border-transparent font-medium"
                  }`}
                >
                  <div className="flex flex-col pr-2">
                    <span className="leading-tight">{option.label}</span>
                    {option.description && (
                      <span
                        className={`text-[10px] mt-0.5 font-normal ${
                          isSelected ? "text-rose-700/80" : "text-stone-400"
                        }`}
                      >
                        {option.description}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-900 text-white shadow-2xs">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
