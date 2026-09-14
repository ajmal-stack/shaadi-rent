"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  Loader2,
  SendHorizonal,
  MapPin,
  Tag,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { loadDraft, clearDraft } from "@/lib/listing-wizard";
import { submitForVerification, loadOutfitForPreview } from "@/app/(public)/list-your-outfit/actions";
import { OutfitMeasurements } from "@/components/outfit/OutfitMeasurements";
import { OutfitAvailability } from "@/components/outfit/OutfitAvailability";
import { getOutfitImageUrl } from "@/lib/utils/image";

export function ListingPreview() {
  const router = useRouter();
  const [outfitId, setOutfitId] = useState<string | null>(() => {
    return loadDraft().outfitId;
  });
  const [outfit, setOutfit] = useState<Awaited<ReturnType<typeof loadOutfitForPreview>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    if (!outfitId) {
      router.replace("/list-your-outfit/details");
      return;
    }
    loadOutfitForPreview(outfitId).then((data) => {
      setOutfit(data);
      setIsLoading(false);
    });
  }, [outfitId, router]);

  async function handleSubmit() {
    if (!outfitId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // submitForVerification will call redirect() on success,
      // which throws a special Next.js redirect error.
      // We only need to handle explicit error returns.
      const result = await submitForVerification(outfitId);
      // If we reach here, the action returned without redirecting (error case)
      if (result && result.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch (e: unknown) {
      // Check if this is a Next.js redirect (not a real error)
      if (e instanceof Error && e.message === "NEXT_REDIRECT") {
        // Expected — redirect happened, clear draft
        clearDraft();
        return;
      }
      // Re-throw actual errors
      throw e;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-rose-600" />
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
        <AlertCircle className="mx-auto mb-2" size={20} />
        <p>Could not load outfit preview. Please go back and check your details.</p>
        <button
          onClick={() => router.push("/list-your-outfit/details")}
          className="mt-4 text-sm font-semibold text-rose-700 underline"
        >
          Back to Details
        </button>
      </div>
    );
  }

  const sortedImages = outfit.images
    ? [...outfit.images].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const primaryImagePath = sortedImages[selectedImageIdx]?.storage_path;
  const imageUrl = getOutfitImageUrl(primaryImagePath);

  const locationText = [outfit.city, outfit.state].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Preview banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3.5 text-xs text-amber-900">
        <Eye size={15} className="shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-900">Customer Preview</p>
          <p className="mt-0.5 text-amber-800/80">
            This is how your listing will appear to customers once approved.
            Review everything carefully before submitting.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Main outfit card */}
      <div className="rounded-3xl border border-rose-100/80 bg-white overflow-hidden shadow-sm">
        {/* Image gallery */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[3/2] w-full bg-stone-100 overflow-hidden">
          <Image
            src={imageUrl}
            alt={outfit.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          {/* Category + Condition badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {outfit.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/90 px-3 py-1 text-[11px] font-bold text-amber-100 backdrop-blur-sm">
                <Tag size={10} />
                {outfit.category.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              <ShieldCheck size={10} className="text-emerald-300" />
              {outfit.condition?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-stone-100">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImageIdx(idx)}
                className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedImageIdx
                    ? "border-rose-600"
                    : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <Image
                  src={getOutfitImageUrl(img.storage_path)}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover object-top"
                />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="p-5 sm:p-7 space-y-4">
          {/* Title + location */}
          <div>
            {outfit.category && (
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {outfit.category.name}
                {outfit.brand && (
                  <span className="ml-2 font-normal text-stone-500 lowercase">
                    · {outfit.brand}
                  </span>
                )}
              </p>
            )}
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900">
              {outfit.title}
            </h2>
            {locationText && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin size={12} className="text-rose-600" />
                {locationText}
              </p>
            )}
          </div>

          {/* Description */}
          {outfit.description && (
            <p className="text-sm text-stone-600 leading-relaxed">
              {outfit.description}
            </p>
          )}

          {/* Pricing block */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
            <div>
              <p className="text-xs font-semibold text-stone-500">Rental Price</p>
              <p className="font-display text-2xl font-extrabold text-stone-950">
                ₹{outfit.rental_price.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-stone-400">per rental</p>
            </div>
            <div className="h-10 w-px bg-rose-200" />
            <div>
              <p className="text-xs font-semibold text-stone-500">Security Deposit</p>
              <p className="text-base font-bold text-stone-700">
                {outfit.security_deposit > 0
                  ? `₹${outfit.security_deposit.toLocaleString("en-IN")}`
                  : "No deposit"}
              </p>
              <p className="text-[11px] text-stone-400">refundable after return</p>
            </div>
            {outfit.size && (
              <>
                <div className="h-10 w-px bg-rose-200" />
                <div>
                  <p className="text-xs font-semibold text-stone-500">Size</p>
                  <p className="text-base font-bold text-stone-700">{outfit.size}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Measurements */}
      {outfit.measurements && (
        <OutfitMeasurements
          measurements={
            // Cast to MeasurementsData to handle Json vs Record<string, unknown> mismatch
            // from Supabase generated types — safe since the shape is known
            (Array.isArray(outfit.measurements)
              ? outfit.measurements[0]
              : outfit.measurements) as import("@/components/outfit/OutfitMeasurements").MeasurementsData
          }
          size={outfit.size}
        />
      )}

      {/* Availability */}
      {outfit.availability && outfit.availability.length > 0 && (
        <OutfitAvailability
          availability={outfit.availability.map((a) => ({
            start_date: a.start_date,
            end_date: a.end_date,
            status: a.status,
          }))}
        />
      )}

      {/* Edit links */}
      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-700">Something wrong? Go back and fix it:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Details", href: "/list-your-outfit/details" },
            { label: "Measurements", href: "/list-your-outfit/measurements" },
            { label: "Photos", href: "/list-your-outfit/photos" },
            { label: "Pricing", href: "/list-your-outfit/pricing" },
            { label: "Availability", href: "/list-your-outfit/availability" },
          ].map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-rose-300 hover:text-rose-800 transition-colors"
            >
              Edit {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-amber-50 p-5 sm:p-6 space-y-3 text-center">
        <p className="text-sm font-semibold text-stone-800">
          Ready to list your outfit?
        </p>
        <p className="text-xs text-stone-500 leading-relaxed">
          After submission, our team will review your listing within 24–48 hours.
          You&apos;ll be notified once it&apos;s approved and live on ShaadiRent.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          id="submit-for-verification-btn"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-8 py-4 text-sm font-bold text-white shadow-md transition-all hover:from-rose-800 hover:to-rose-950 hover:shadow-lg disabled:opacity-60 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <SendHorizonal size={16} />
          )}
          {isSubmitting ? "Submitting…" : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}
