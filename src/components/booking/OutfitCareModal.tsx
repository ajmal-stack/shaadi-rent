"use client";

import {
  X,
  Sparkles,
  Scissors,
  Wind,
  ShieldCheck,
  Package,
  Droplet,
  Heart,
  CheckCircle2,
} from "lucide-react";

interface OutfitCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitTitle: string;
}

export function OutfitCareModal({
  isOpen,
  onClose,
  outfitTitle,
}: OutfitCareModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-stone-200 p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto sleek-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-800 border border-rose-200/80">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-stone-900">
                Outfit Care &amp; Wearing Guide
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-xs">
                Essential care guidelines for {outfitTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4 Essential Guidelines Grid */}
        <div className="space-y-3.5 text-xs">
          {/* 1. Steaming only */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Wind size={16} className="text-amber-700" />
              <span>1. Steaming Only — Never Direct Iron</span>
            </div>
            <p className="text-stone-600 leading-relaxed pl-6">
              Designer embroidery, metallic threads (zari), and velvet fabrics will melt or burn under a hot iron.
              Use a handheld garment steamer from a 6-inch distance, or hang in a steamy bathroom for 15 minutes.
            </p>
          </div>

          {/* 2. Makeup & Perfumes */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <Droplet size={16} className="text-rose-700" />
              <span>2. Perfume &amp; Makeup Precautions</span>
            </div>
            <p className="text-stone-600 leading-relaxed pl-6">
              Apply perfumes, body lotions, and hairspray at least 15 minutes before wearing the outfit. Alcohol and oils can oxidize authentic zardozi embroidery.
            </p>
          </div>

          {/* 3. Free Alteration Kit */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-teal-950">
              <Scissors size={16} className="text-teal-700" />
              <span>3. Included Emergency Alteration Kit</span>
            </div>
            <p className="text-stone-600 leading-relaxed pl-6">
              Every ShaadiRent package includes a sealed alteration kit containing double-sided fabric tape, padded safety pins, hook extenders, and extra matching latkan strings.
            </p>
          </div>

          {/* 4. No Dry Cleaning Required */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <Package size={16} className="text-emerald-700" />
              <span>4. Zero-Hassle Return Packaging</span>
            </div>
            <p className="text-stone-600 leading-relaxed pl-6">
              Do NOT attempt to wash or dry-clean the outfit after the event. Simply pack it back into the prepaid waterproof garment bag on its original hanger. Professional eco-friendly sanitization is 100% covered by ShaadiRent.
            </p>
          </div>
        </div>

        {/* Insurance Guarantee */}
        <div className="rounded-2xl bg-stone-900 text-stone-200 p-4 flex items-center gap-3">
          <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-relaxed">
            <p className="font-bold text-white">Minor Wear &amp; Tear Insured</p>
            <p className="text-stone-400">
              Minor hem dust, loose sequins, or invisible fold creases are completely covered by our rental guarantee.
            </p>
          </div>
        </div>

        {/* Close CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-800 to-stone-950 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:from-rose-900 hover:to-black transition-all cursor-pointer text-center"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
}
