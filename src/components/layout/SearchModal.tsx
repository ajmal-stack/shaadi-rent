"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "Bridal Lehengas",
  "Groom Sherwanis",
  "Sabyasachi Inspired",
  "Reception Gowns",
  "Haldi & Mehendi",
  "Royal Jewellery",
  "Velvet Anarkalis",
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    onClose();
    router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = inputRef.current?.value ?? "";
    handleSearch(query);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search outfits"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 sm:px-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-rose-100/40 bg-white shadow-2xl transition-all duration-200">
        {/* Search Header Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b border-rose-100/60 px-4 sm:px-6 py-4 bg-rose-50/30"
        >
          <Search size={22} className="text-rose-700 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            name="search"
            placeholder="Search designer lehengas, sherwanis, jewellery..."
            className="w-full bg-transparent text-base sm:text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-100/60 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </form>

        {/* Modal Body: Suggestions & Quick Searches */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
              <Sparkles size={14} className="text-amber-600" />
              Trending Wedding Collections
            </p>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Press ESC to exit
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSearch(item)}
                className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/50 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:border-rose-300 hover:bg-rose-100/80 hover:text-rose-900 transition-all duration-150 active:scale-95"
              >
                <span>{item}</span>
                <ArrowRight size={12} className="text-rose-400" />
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-rose-900 to-amber-950 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold tracking-wide text-amber-200">
                  ShaadiRent Concierge
                </p>
                <p className="text-xs text-rose-100/80 mt-0.5">
                  Looking for custom bridal sizing or matching groom outfits?
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/how-it-works");
                }}
                className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors"
              >
                Learn How
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
