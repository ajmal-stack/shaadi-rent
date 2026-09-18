"use client";

import { useState, useMemo, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminEmptyState } from "./AdminEmptyState";
import { deleteReview } from "@/app/(admin)/admin/reviews/actions";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string | null } | null;
  outfit: { id: string; title: string } | null;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-stone-200 dark:text-stone-700 fill-stone-200 dark:fill-stone-700"}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-stone-600 dark:text-stone-300">{rating}.0</span>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

interface ReviewsClientProps {
  initialReviews: ReviewRow[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(
    () => ({
      all: reviews.length,
      "5": reviews.filter((r) => r.rating === 5).length,
      "4": reviews.filter((r) => r.rating === 4).length,
      "3": reviews.filter((r) => r.rating === 3).length,
      "2": reviews.filter((r) => r.rating === 2).length,
      "1": reviews.filter((r) => r.rating === 1).length,
    }),
    [reviews]
  );

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.outfit?.title.toLowerCase().includes(q) ||
          r.reviewer?.full_name?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, ratingFilter, search]);

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteReview(id);
      if (result.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.success("Review deleted.");
      } else {
        toast.error(result.error ?? "Failed to delete.");
      }
      setConfirmDelete(null);
    });
  }

  const tabs = [
    { value: "all", label: "All", count: ratingCounts.all },
    { value: "5", label: "⭐⭐⭐⭐⭐", count: ratingCounts["5"] },
    { value: "4", label: "⭐⭐⭐⭐", count: ratingCounts["4"] },
    { value: "3", label: "⭐⭐⭐", count: ratingCounts["3"] },
    { value: "2", label: "⭐⭐", count: ratingCounts["2"] },
    { value: "1", label: "⭐", count: ratingCounts["1"] },
  ];

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex items-center gap-6 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-xs text-stone-400 dark:text-stone-500 mt-1">{reviews.length} reviews</span>
        </div>
        <div className="flex-1 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((r) => {
            const count = ratingCounts[String(r) as keyof typeof ratingCounts];
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-2">
                <span className="text-xs text-stone-500 dark:text-stone-400 w-4 text-right">{r}</span>
                <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500 w-6">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs tabs={tabs} active={ratingFilter} onChange={(v) => setRatingFilter(v as RatingFilter)} />
        <AdminSearch value={search} onChange={setSearch} placeholder="Search outfit, reviewer, comment…" className="sm:w-64" />
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Star}
            title="No reviews found"
            description="No reviews match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Outfit</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Reviewer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Comment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((review) => {
                  const isConfirming = confirmDelete === review.id;
                  return (
                    <tr key={review.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200 max-w-[140px] truncate block">
                          {review.outfit?.title ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                          {review.reviewer?.full_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-600 dark:text-stone-300 max-w-[200px] truncate block">
                          {review.comment ?? <span className="text-stone-300 dark:text-stone-600 italic">No comment</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {formatDate(review.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-rose-600 dark:text-rose-400">Delete?</span>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDelete(review.id)}
                              className="text-[11px] font-bold text-rose-700 dark:text-rose-400 disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-[11px] text-stone-400 dark:text-stone-500"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(review.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-stone-400 dark:text-stone-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
          Showing {filtered.length} of {reviews.length} reviews
        </p>
      )}
    </div>
  );
}
