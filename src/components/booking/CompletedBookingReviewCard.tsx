"use client";

import { useState } from "react";
import { Star, Sparkles, CheckCircle2 } from "lucide-react";
import { ReviewModal } from "@/components/booking/ReviewModal";
import type { Review } from "@/types/database";

interface CompletedBookingReviewCardProps {
  bookingId: string;
  outfitTitle: string;
  existingReview: Review | null;
}

export function CompletedBookingReviewCard({
  bookingId,
  outfitTitle,
  existingReview,
}: CompletedBookingReviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(existingReview);

  // If already reviewed, display the review card
  if (review) {
    const formattedDate = new Date(review.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-amber-100/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold text-sm">
              ★
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-stone-900">Your Verified Review</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 size={10} /> Published
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Submitted on {formattedDate}</p>
            </div>
          </div>

          {/* Star rating display */}
          <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-full border border-amber-200/70 shadow-2xs">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={
                  s <= review.rating
                    ? "fill-amber-400 text-amber-500"
                    : "text-stone-200 fill-stone-100"
                }
              />
            ))}
            <span className="text-xs font-bold text-amber-900 ml-1">
              {review.rating}.0
            </span>
          </div>
        </div>

        {review.comment ? (
          <div className="rounded-2xl bg-white/90 border border-amber-100/80 p-4">
            <p className="text-xs text-stone-700 leading-relaxed italic">
              &ldquo;{review.comment}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">
            You gave this outfit a {review.rating}-star rating.
          </p>
        )}

        <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-600" />
          Thank you for sharing your feedback! Your review helps future brides &amp; grooms.
        </p>
      </div>
    );
  }

  // If not yet reviewed, display interactive prompt to leave a review
  return (
    <>
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/90 via-rose-50/40 to-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-xs shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-stone-900">
                How Was Your Experience?
              </h3>
              <span className="rounded-full bg-amber-100/80 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                Completed
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Your wedding rental is complete! Take 30 seconds to rate the outfit&apos;s fit, condition, and look. Real reviews help other brides &amp; grooms make confident choices.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={18} className="fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-semibold text-stone-600 ml-1.5">
              Rate from 1 to 5 stars
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-700 to-rose-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-700 hover:to-rose-900 hover:shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Sparkles size={14} />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      <ReviewModal
        bookingId={bookingId}
        outfitTitle={outfitTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Trigger local update or reload
          window.location.reload();
        }}
      />
    </>
  );
}
