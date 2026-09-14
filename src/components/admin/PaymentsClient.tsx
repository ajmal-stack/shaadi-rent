"use client";

import { useState, useMemo } from "react";
import { CreditCard, TrendingUp, Clock, AlertTriangle, ArrowDownLeft } from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import type { PaymentStatus } from "@/types/database";

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string | null;
  created_at: string;
  bookings: {
    id: string;
    booking_number: string;
    total_amount: number;
    renter: { full_name: string | null } | null;
  } | null;
};

type StatusFilter = "all" | PaymentStatus;

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 bg-white ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-stone-900">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-stone-50">{icon}</div>
      </div>
    </div>
  );
}

interface PaymentsClientProps {
  initialPayments: PaymentRow[];
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const successful = initialPayments.filter(
      (p) => p.status === "successful" || p.status === "paid"
    );
    const pending = initialPayments.filter((p) => p.status === "pending" || p.status === "created");
    const failed = initialPayments.filter((p) => p.status === "failed");
    const refunded = initialPayments.filter(
      (p) => p.status === "refunded" || p.status === "partially_refunded"
    );

    return {
      totalRevenue: successful.reduce((s, p) => s + p.amount, 0),
      pending: pending.reduce((s, p) => s + p.amount, 0),
      failed: failed.reduce((s, p) => s + p.amount, 0),
      refunded: refunded.reduce((s, p) => s + p.amount, 0),
    };
  }, [initialPayments]);

  const counts = useMemo(
    () => ({
      all: initialPayments.length,
      successful: initialPayments.filter((p) => p.status === "successful").length,
      pending: initialPayments.filter((p) => p.status === "pending").length,
      failed: initialPayments.filter((p) => p.status === "failed").length,
      refunded: initialPayments.filter((p) => p.status === "refunded").length,
      partially_refunded: initialPayments.filter((p) => p.status === "partially_refunded").length,
      created: initialPayments.filter((p) => p.status === "created").length,
    }),
    [initialPayments]
  );

  const filtered = useMemo(() => {
    return initialPayments.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.provider_payment_id?.toLowerCase().includes(q) ||
          p.bookings?.booking_number.toLowerCase().includes(q) ||
          p.bookings?.renter?.full_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialPayments, filter, search]);

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "successful", label: "Successful", count: counts.successful },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "failed", label: "Failed", count: counts.failed },
    { value: "refunded", label: "Refunded", count: counts.refunded },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          colorClass="border-emerald-100"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(stats.pending)}
          icon={<Clock size={18} className="text-amber-500" />}
          colorClass="border-amber-100"
        />
        <StatCard
          label="Failed"
          value={formatCurrency(stats.failed)}
          icon={<AlertTriangle size={18} className="text-rose-500" />}
          colorClass="border-rose-100"
        />
        <StatCard
          label="Refunded"
          value={formatCurrency(stats.refunded)}
          icon={<ArrowDownLeft size={18} className="text-sky-500" />}
          colorClass="border-sky-100"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={tabs}
          active={filter}
          onChange={(v) => setFilter(v as StatusFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search booking #, renter, payment ID…"
          className="sm:w-72"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={CreditCard}
            title="No payments found"
            description="No payment records match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Payment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Booking</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Renter</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                          <CreditCard size={14} className="text-stone-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-800 uppercase">
                            {payment.provider}
                          </p>
                          {payment.provider_payment_id && (
                            <p className="font-mono text-[10px] text-stone-400 truncate max-w-[120px]">
                              {payment.provider_payment_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {payment.bookings?.booking_number ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-stone-700">
                        {payment.bookings?.renter?.full_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-stone-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-stone-500">
                        {formatDate(payment.created_at)}
                      </span>
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
          Showing {filtered.length} of {initialPayments.length} payments
        </p>
      )}
    </div>
  );
}
