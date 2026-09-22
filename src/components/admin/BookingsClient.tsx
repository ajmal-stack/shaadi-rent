"use client";

import { useState, useMemo } from "react";
import { CalendarCheck, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { BookingDetailModal, type BookingDetailData } from "./BookingDetailModal";
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
  const [bookingsList, setBookingsList] = useState<BookingRow[]>(initialBookings);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [activeBooking, setActiveBooking] = useState<BookingDetailData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: bookingsList.length,
      active: bookingsList.filter((b) => b.status === "active").length,
      confirmed: bookingsList.filter((b) => b.status === "confirmed").length,
      completed: bookingsList.filter((b) => b.status === "completed").length,
      cancelled: bookingsList.filter((b) => b.status === "cancelled").length,
      disputed: bookingsList.filter((b) => b.status === "disputed").length,
      pending: bookingsList.filter((b) => b.status === "pending").length,
      inspection: bookingsList.filter((b) => b.status === "inspection").length,
    }),
    [bookingsList]
  );

  const filtered = useMemo(() => {
    return bookingsList.filter((b) => {
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
  }, [bookingsList, filter, search]);

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "confirmed", label: "Confirmed", count: counts.confirmed },
    { value: "active", label: "Active", count: counts.active },
    { value: "inspection", label: "Inspection", count: counts.inspection },
    { value: "completed", label: "Completed", count: counts.completed },
    { value: "cancelled", label: "Cancelled", count: counts.cancelled },
    { value: "disputed", label: "Disputed", count: counts.disputed },
  ];

  async function openDetail(booking: BookingRow) {
    try {
      setLoadingId(booking.id);
      const res = await fetch(`/api/admin/bookings/${booking.id}`);
      if (!res.ok) throw new Error("Failed to load booking details.");
      const detail: BookingDetailData = await res.json();
      setActiveBooking(detail);
    } catch {
      toast.error("Could not load booking details. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function handleModalUpdate(id: string, updates: Partial<BookingDetailData>) {
    setBookingsList((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...(updates.status && { status: updates.status }),
              ...(updates.payment_status && { payment_status: updates.payment_status }),
            }
          : b
      )
    );
    if (activeBooking?.id === id) {
      setActiveBooking((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  }

  return (
    <>
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

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={CalendarCheck}
              title="No bookings found"
              description="No bookings match the current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/60">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Booking #</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Outfit</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Renter</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Rental Dates</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden xl:table-cell">Payment</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {filtered.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                          {booking.booking_number}
                        </span>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">{formatDate(booking.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 max-w-[150px] truncate">
                          {booking.outfits?.title ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm text-stone-700 dark:text-stone-300">{booking.renter?.full_name ?? "—"}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-[140px]">{booking.renter?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                          <div>{formatDate(booking.rental_start_date)}</div>
                          <div className="text-stone-400 dark:text-stone-500">to {formatDate(booking.rental_end_date)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{formatCurrency(booking.total_amount)}</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">incl. ₹{booking.security_deposit.toLocaleString("en-IN")} deposit</p>
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <AdminBadge status={booking.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={loadingId === booking.id}
                          onClick={() => openDetail(booking)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-2xs active:scale-95 disabled:opacity-60 cursor-pointer"
                        >
                          {loadingId === booking.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
            Showing {filtered.length} of {bookingsList.length} bookings
          </p>
        )}
      </div>

      {activeBooking && (
        <BookingDetailModal
          booking={activeBooking}
          onClose={() => setActiveBooking(null)}
          onUpdate={handleModalUpdate}
        />
      )}
    </>
  );
}
