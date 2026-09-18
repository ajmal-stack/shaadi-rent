"use client";

import Link from "next/link";

export interface RecentBooking {
  id: string;
  booking_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  outfit_title: string | null;
  renter_name: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/60", label: "Pending" },
  confirmed: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800/60", label: "Confirmed" },
  active: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/60", label: "Active" },
  completed: { bg: "bg-stone-100 dark:bg-stone-800", text: "text-stone-600 dark:text-stone-300", border: "border-stone-200 dark:border-stone-700", label: "Completed" },
  cancelled: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60", label: "Cancelled" },
  disputed: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-800 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800/60", label: "Disputed" },
  returned: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800/60", label: "Returned" },
  delivered: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800/60", label: "Delivered" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface RecentBookingsFeedProps {
  bookings: RecentBooking[];
}

export function RecentBookingsFeed({ bookings }: RecentBookingsFeedProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <p className="text-xs text-stone-400 dark:text-stone-500 py-8 text-center">No bookings yet.</p>
    );
  }

  return (
    <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
      {bookings.map((b) => {
        const style = STATUS_STYLES[b.status] ?? STATUS_STYLES["pending"];
        return (
          <div
            key={b.id}
            className="py-3.5 flex items-center gap-3 flex-wrap group"
          >
            {/* Booking number */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {b.outfit_title ?? "Outfit"}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                #{b.booking_number} · {b.renter_name ?? "Customer"} · {formatDate(b.created_at)}
              </p>
            </div>

            {/* Amount */}
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums flex-shrink-0">
              ₹{b.total_amount.toLocaleString("en-IN")}
            </p>

            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${style.bg} ${style.text} ${style.border}`}
            >
              {style.label}
            </span>

            {/* Link */}
            <Link
              href="/admin/bookings"
              className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-950 dark:hover:text-rose-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              View →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

