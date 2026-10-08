"use client";

import { useState } from "react";
import { Star, ShieldCheck, Sparkles, ThumbsUp, MessageSquare } from "lucide-react";

export interface OutfitReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
}

interface OutfitReviewsProps {
  reviews: OutfitReviewItem[];
  avgRating: number | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] || "V").toUpperCase();
}

export function OutfitReviews({ reviews, avgRating }: OutfitReviewsProps) {
  const [selectedFilter, setSelectedFilter] = useState<number | "all">("all");
  const [displayCount, setDisplayCount] = useState(4);

  const totalReviews = reviews.length;

  // Rating distribution counts
  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const filteredReviews =
    selectedFilter === "all"
      ? reviews
      : reviews.filter((r) => r.rating === selectedFilter);

  const visibleReviews = filteredReviews.slice(0, displayCount);

  return (
    <section
      id="outfit-reviews"
      aria-label="Customer Reviews"
      className="rounded-3xl border border-rose-100/90 bg-white p-6 sm:p-8 shadow-xs space-y-8"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-900 mb-2">
            <Sparkles size={12} className="text-amber-600" />
            Verified Customer Stories
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
            Renter Reviews &amp; Experiences
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real feedback from brides &amp; grooms who wore this ensemble for their celebrations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full self-start sm:self-auto shrink-0 font-medium">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>100% Verified Rentals</span>
        </div>
      </div>

      {totalReviews > 0 ? (
        <>
          {/* ── Summary & Star Breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-stone-50/70 border border-stone-100 items-center">
            {/* Score box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-stone-200/70">
              <span className="font-display text-5xl font-extrabold text-stone-900 tracking-tight">
                {avgRating !== null ? avgRating.toFixed(1) : "—"}
              </span>

              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={18}
                    className={
                      avgRating !== null && s <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-500"
                        : "text-stone-300"
                    }
                  />
                ))}
              </div>

              <p className="text-xs font-semibold text-stone-600">
                Based on <strong className="text-stone-900">{totalReviews}</strong> verified rental{totalReviews > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                98% would recommend this outfit
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="md:col-span-7 space-y-2 text-xs">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = ratingCounts[star];
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                const isSelected = selectedFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setSelectedFilter(isSelected ? "all" : star)
                    }
                    className={`w-full flex items-center gap-3 p-1.5 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-amber-100/70 font-semibold"
                        : "hover:bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-1 w-10 text-stone-700 shrink-0 font-medium">
                      <span>{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                    </span>

                    <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-14 text-right text-[11px] text-stone-500 shrink-0">
                      {count} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Filter Pills (if active) ── */}
          {selectedFilter !== "all" && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-500">
                Filtering by <strong>{selectedFilter} Stars</strong> ({filteredReviews.length} reviews)
              </span>
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className="text-amber-800 font-semibold hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* ── Reviews Feed ── */}
          <div className="space-y-4">
            {visibleReviews.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-stone-100 bg-white p-5 space-y-3 transition-shadow hover:shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 text-amber-900 font-bold text-xs shrink-0 border border-rose-200/60 shadow-2xs">
                      {getInitials(item.reviewerName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">
                          {item.reviewerName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <ShieldCheck size={10} /> Verified Renter
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 block">
                        Reviewed in {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={
                          s <= item.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-200 fill-stone-100"
                        }
                      />
                    ))}
                  </div>
                </div>

                {item.comment && (
                  <p className="text-xs text-stone-700 leading-relaxed pl-12 whitespace-pre-line">
                    {item.comment}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredReviews.length > displayCount && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + 4)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Show More Reviews ({filteredReviews.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Empty State ── */
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-900">
            <MessageSquare size={22} className="text-amber-700" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display text-base font-bold text-stone-900">
              Be the First to Review This Outfit
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              No reviews submitted for this specific piece yet. Every outfit in our collection is 100% genuine couture, inspected, and sanitized before delivery.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-600">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-700" /> Steam Sanitized &amp; Inspected
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={13} className="text-amber-700" /> Free Backup Size Included
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
