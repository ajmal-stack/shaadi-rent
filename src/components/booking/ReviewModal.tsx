"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitBookingReview } from "@/app/actions/review";

interface ReviewModalProps {
  bookingId: string;
  outfitTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Poor experience / Major issues",
  2: "Below expectations / Fit or condition issues",
  3: "Decent / Average rental experience",
  4: "Very good! Great condition & fit",
  5: "Exceptional / Felt like royalty! 👑",
};

export function ReviewModal({
  bookingId,
  outfitTitle,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a star rating from 1 to 5.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBookingReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || "Failed to submit review.");
        toast.error(result.error || "Failed to submit review.");
        return;
      }

      toast.success("Thank you! Your review has been published.");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-rose-100 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          aria-label="Close review modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800">
            <Sparkles size={22} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              Rate Your Experience
            </h2>
            <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-sm mt-0.5">
              {outfitTitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Section */}
          <div className="rounded-2xl bg-amber-50/50 border border-amber-100/80 p-5 text-center space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
              Your Overall Rating
            </label>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= displayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    disabled={isSubmitting}
                    className="p-1.5 focus:outline-none transform transition-all active:scale-90 hover:scale-110 cursor-pointer"
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={34}
                      className={
                        filled
                          ? "fill-amber-400 text-amber-500 filter drop-shadow-xs"
                          : "text-stone-300 hover:text-amber-300"
                      }
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-amber-900 min-h-[1.25rem]">
              {RATING_DESCRIPTIONS[displayRating] || ""}
            </p>
          </div>

          {/* Detailed Comments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-xs font-bold uppercase tracking-wider text-stone-700"
              >
                Written Review <span className="text-stone-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-stone-400">
                {comment.length} / 2000
              </span>
            </div>

            <textarea
              id="review-comment"
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the fit, fabric feel, craftsmanship, and compliments? Was it delivered on time? Share any sizing or styling advice for future renters..."
              className="w-full rounded-2xl border border-stone-200 bg-white p-3.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Trust reassurance note */}
          <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3 text-[11px] text-stone-600 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-emerald-700 shrink-0 mt-0.5" />
            <p>
              Your review will appear as a <strong>Verified Renter Review</strong> on the outfit page to help brides &amp; grooms choose with confidence.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-stone-200 bg-white py-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-700 to-rose-800 py-3 text-xs font-bold text-white shadow-md hover:from-amber-700 hover:to-rose-900 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
