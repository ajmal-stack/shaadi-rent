"use client";

import { useState, useMemo } from "react";
import { CalendarCheck, MapPin } from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import type { BookingStatus, BookingPaymentStatus } from "@/types/database";

type BookingRow = {
  id: string;
  booking_number: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  rental_amount: number;
  security_deposit: number;
  status: BookingStatus;
  payment_status: BookingPaymentStatus;
  created_at: string;
  outfits: { id: string; title: string } | null;
  renter: { id: string; full_name: string | null; email: string | null } | null;
};

type StatusFilter = "all" | BookingStatus;

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface BookingsClientProps {
  initialBookings: BookingRow[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      all: initialBookings.length,
      active: initialBookings.filter((b) => b.status === "active").length,
      confirmed: initialBookings.filter((b) => b.status === "confirmed").length,
      completed: initialBookings.filter((b) => b.status === "completed").length,
      cancelled: initialBookings.filter((b) => b.status === "cancelled").length,
      disputed: initialBookings.filter((b) => b.status === "disputed").length,
      pending: initialBookings.filter((b) => b.status === "pending").length,
    }),
    [initialBookings]
  );

  const filtered = useMemo(() => {
    return initialBookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.booking_number.toLowerCase().includes(q) ||
          b.outfits?.title.toLowerCase().includes(q) ||
          b.renter?.full_name?.toLowerCase().includes(q) ||
          b.renter?.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialBookings, filter, search]);

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "confirmed", label: "Confirmed", count: counts.confirmed },
    { value: "active", label: "Active", count: counts.active },
    { value: "completed", label: "Completed", count: counts.completed },
    { value: "cancelled", label: "Cancelled", count: counts.cancelled },
    { value: "disputed", label: "Disputed", count: counts.disputed },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={tabs}
          active={filter}
          onChange={(v) => setFilter(v as StatusFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search booking #, outfit, renter…"
          className="sm:w-72"
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={CalendarCheck}
            title="No bookings found"
            description="No bookings match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Booking #</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Outfit</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Renter</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Rental Dates</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden xl:table-cell">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded-lg">
                        {booking.booking_number}
                      </span>
                      <p className="text-[11px] text-stone-400 mt-1">
                        {formatDate(booking.created_at)}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm font-medium text-stone-800 max-w-[150px] truncate">
                        {booking.outfits?.title ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-stone-700">{booking.renter?.full_name ?? "—"}</p>
                      <p className="text-xs text-stone-400 truncate max-w-[140px]">
                        {booking.renter?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-stone-600 space-y-0.5">
                        <div>{formatDate(booking.rental_start_date)}</div>
                        <div className="text-stone-400">to {formatDate(booking.rental_end_date)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-stone-900">
                        {formatCurrency(booking.total_amount)}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        incl. ₹{booking.security_deposit.toLocaleString("en-IN")} deposit
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <AdminBadge status={booking.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          Showing {filtered.length} of {initialBookings.length} bookings
        </p>
      )}
    </div>
  );
}
