"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  RotateCcw,
  Eye,
  X,
  Check,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { initiateRefund, releaseEscrow } from "@/app/(admin)/admin/payments/actions";
import type { PaymentStatus } from "@/types/database";

export interface PaymentRefundRecord {
  refund_id: string;
  amount: number;
  reason: string;
  processed_at: string;
  processed_by?: string;
}

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  metadata: {
    refunds?: PaymentRefundRecord[];
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at?: string;
  bookings: {
    id: string;
    booking_number: string;
    status?: string;
    payment_status?: string;
    rental_amount?: number;
    security_deposit?: number;
    total_amount: number;
    rental_start_date?: string;
    rental_end_date?: string;
    event_date?: string | null;
    created_at?: string;
    renter: {
      full_name: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    outfit?: {
      title: string;
      brand: string | null;
      slug: string;
    } | null;
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

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    <div className={`rounded-2xl border p-5 bg-white dark:bg-stone-900 ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800">{icon}</div>
      </div>
    </div>
  );
}

const COMMON_REFUND_REASONS = [
  "Security deposit refund post-inspection",
  "Customer dispute settlement approved",
  "Outfit damaged / condition mismatch",
  "Booking cancelled before dispatch",
  "Wrong size delivered",
  "Other adjustment",
];

interface PaymentsClientProps {
  initialPayments: PaymentRow[];
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [detailPayment, setDetailPayment] = useState<PaymentRow | null>(null);
  const [refundPayment, setRefundPayment] = useState<PaymentRow | null>(null);

  // Refund form state
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>(COMMON_REFUND_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isPendingEscrow, startEscrowTransition] = useTransition();

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  const stats = useMemo(() => {
    const successful = payments.filter(
      (p) => p.status === "successful" || (p.status as string) === "paid"
    );
    const pending = payments.filter((p) => p.status === "pending" || p.status === "created");
    const failed = payments.filter((p) => p.status === "failed");
    const refunded = payments.filter(
      (p) => p.status === "refunded" || p.status === "partially_refunded"
    );

    return {
      totalRevenue: successful.reduce((s, p) => s + p.amount, 0),
      pending: pending.reduce((s, p) => s + p.amount, 0),
      failed: failed.reduce((s, p) => s + p.amount, 0),
      refunded: refunded.reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  const counts = useMemo(
    () => ({
      all: payments.length,
      successful: payments.filter((p) => p.status === "successful").length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      refunded: payments.filter((p) => p.status === "refunded").length,
      partially_refunded: payments.filter((p) => p.status === "partially_refunded").length,
      created: payments.filter((p) => p.status === "created").length,
    }),
    [payments]
  );

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.provider_payment_id?.toLowerCase().includes(q) ||
          p.provider_order_id?.toLowerCase().includes(q) ||
          p.bookings?.booking_number.toLowerCase().includes(q) ||
          p.bookings?.renter?.full_name?.toLowerCase().includes(q) ||
          p.bookings?.outfit?.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, filter, search]);

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "successful", label: "Successful", count: counts.successful },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "failed", label: "Failed", count: counts.failed },
    { value: "refunded", label: "Refunded", count: counts.refunded },
  ];

  // Open refund modal with prefilled max refundable amount
  const handleOpenRefund = (payment: PaymentRow) => {
    const existingRefunds = Array.isArray(payment.metadata?.refunds)
      ? payment.metadata.refunds
      : [];
    const previouslyRefunded = existingRefunds.reduce(
      (acc, r) => acc + (Number(r.amount) || 0),
      0
    );
    const maxRefundable = Math.max(0, payment.amount - previouslyRefunded);

    setRefundPayment(payment);
    setRefundAmount(String(maxRefundable));
    setRefundReason(COMMON_REFUND_REASONS[0]);
    setCustomReason("");
  };

  // Submit refund action
  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPayment) return;

    const parsedAmount = parseFloat(refundAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive refund amount.");
      return;
    }

    const finalReason =
      refundReason === "Other adjustment" ? customReason.trim() : refundReason;
    if (!finalReason) {
      toast.error("Please provide a reason for the refund.");
      return;
    }

    setIsRefunding(true);
    try {
      const res = await initiateRefund(refundPayment.id, parsedAmount, finalReason);
      if (!res.success) {
        toast.error(res.error || "Failed to process refund.");
        return;
      }

      toast.success(
        `Refund of ${formatCurrency(parsedAmount)} processed successfully. (ID: ${res.refundId})`
      );

      // Optimistically update local payments state
      const updatedStatus = res.newStatus || "refunded";
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id !== refundPayment.id) return p;
          const currentMeta = p.metadata || {};
          const existingRefunds = Array.isArray(currentMeta.refunds)
            ? currentMeta.refunds
            : [];
          return {
            ...p,
            status: updatedStatus,
            metadata: {
              ...currentMeta,
              refunds: [
                ...existingRefunds,
                {
                  refund_id: res.refundId || "rfnd_manual",
                  amount: parsedAmount,
                  reason: finalReason,
                  processed_at: new Date().toISOString(),
                },
              ],
            },
          };
        })
      );

      // If detail modal is open for this payment, update it
      if (detailPayment?.id === refundPayment.id) {
        setDetailPayment((prev) =>
          prev ? { ...prev, status: updatedStatus } : null
        );
      }

      setRefundPayment(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing refund.";
      toast.error(msg);
    } finally {
      setIsRefunding(false);
    }
  };

  // Release escrow action
  const handleReleaseEscrow = (bookingId: string) => {
    startEscrowTransition(async () => {
      const res = await releaseEscrow(bookingId);
      if (!res.success) {
        toast.error(res.error || "Failed to release escrow.");
      } else {
        toast.success("Escrow payout released to owner successfully.");
        if (detailPayment) {
          toast.info("Escrow status recorded in booking audit logs.");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />}
          colorClass="border-emerald-100 dark:border-emerald-900/50"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(stats.pending)}
          icon={<Clock size={18} className="text-amber-500 dark:text-amber-400" />}
          colorClass="border-amber-100 dark:border-amber-900/50"
        />
        <StatCard
          label="Failed"
          value={formatCurrency(stats.failed)}
          icon={<AlertTriangle size={18} className="text-rose-500 dark:text-rose-400" />}
          colorClass="border-rose-100 dark:border-rose-900/50"
        />
        <StatCard
          label="Refunded"
          value={formatCurrency(stats.refunded)}
          icon={<ArrowDownLeft size={18} className="text-sky-500 dark:text-sky-400" />}
          colorClass="border-sky-100 dark:border-sky-900/50"
        />
      </div>

      {/* ── Toolbar ── */}
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

      {/* ── Table ── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={CreditCard}
            title="No payments found"
            description="No payment records match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">
                    Booking
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">
                    Renter
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((payment) => {
                  const isRefundable =
                    payment.status === "successful" ||
                    payment.status === "partially_refunded";

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      {/* Payment Provider & ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                            <CreditCard
                              size={14}
                              className="text-stone-500 dark:text-stone-400"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase">
                              {payment.provider}
                            </p>
                            {payment.provider_payment_id ? (
                              <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[120px]">
                                {payment.provider_payment_id}
                              </p>
                            ) : (
                              <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[120px]">
                                {payment.id.slice(0, 8)}…
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Booking # */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                          {payment.bookings?.booking_number ?? "—"}
                        </span>
                      </td>

                      {/* Renter */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                          {payment.bookings?.renter?.full_name ?? "—"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <AdminBadge status={payment.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {formatDate(payment.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Button */}
                          <button
                            type="button"
                            onClick={() => setDetailPayment(payment)}
                            title="View Payment Details"
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          {/* Refund Button */}
                          {isRefundable && (
                            <button
                              type="button"
                              onClick={() => handleOpenRefund(payment)}
                              title="Issue Full or Partial Refund"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                            >
                              <RotateCcw size={12} />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
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
          Showing {filtered.length} of {payments.length} payments
        </p>
      )}

      {/* ── 1. REFUND MODAL ── */}
      {refundPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRefunding) setRefundPayment(null);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-5 my-8 text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Process Payment Refund
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Reversal for Booking #{refundPayment.bookings?.booking_number ?? refundPayment.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundPayment(null)}
                disabled={isRefunding}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Refund Financial Summary */}
            {(() => {
              const refunds = Array.isArray(refundPayment.metadata?.refunds)
                ? refundPayment.metadata.refunds
                : [];
              const previouslyRefunded = refunds.reduce(
                (sum, r) => sum + (Number(r.amount) || 0),
                0
              );
              const maxRefundable = Math.max(0, refundPayment.amount - previouslyRefunded);

              return (
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 p-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Paid
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                      {formatCurrency(refundPayment.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Refunded
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                      {formatCurrency(previouslyRefunded)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                      Available
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      {formatCurrency(maxRefundable)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Warning banner */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="leading-relaxed">
                Refunds are routed through the payment gateway back to the customer&apos;s original payment method. This operation is recorded in the booking audit log and cannot be undone.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteRefund} className="space-y-4 text-xs">
              {/* Refund Amount Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="refund-amount-input"
                  className="block font-bold text-stone-800 dark:text-stone-200"
                >
                  Refund Amount (₹) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 dark:text-stone-400 font-bold">
                    ₹
                  </span>
                  <input
                    id="refund-amount-input"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    disabled={isRefunding}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 pl-8 pr-3.5 py-2.5 text-stone-900 dark:text-stone-100 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700"
                  />
                </div>

                {/* Quick select presets */}
                {(() => {
                  const refunds = Array.isArray(refundPayment.metadata?.refunds)
                    ? refundPayment.metadata.refunds
                    : [];
                  const prev = refunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                  const max = Math.max(0, refundPayment.amount - prev);
                  const secDeposit = refundPayment.bookings?.security_deposit;

                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setRefundAmount(String(max))}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                      >
                        Full Refund ({formatCurrency(max)})
                      </button>
                      {max > 1 && (
                        <button
                          type="button"
                          onClick={() => setRefundAmount(String(Math.round(max / 2)))}
                          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        >
                          50% ({formatCurrency(Math.round(max / 2))})
                        </button>
                      )}
                      {secDeposit && secDeposit > 0 && secDeposit <= max && (
                        <button
                          type="button"
                          onClick={() => setRefundAmount(String(secDeposit))}
                          className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        >
                          Security Deposit ({formatCurrency(secDeposit)})
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="refund-reason-select"
                  className="block font-bold text-stone-800 dark:text-stone-200"
                >
                  Reason for Refund <span className="text-rose-600">*</span>
                </label>
                <select
                  id="refund-reason-select"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  disabled={isRefunding}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-stone-900 dark:text-stone-100 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 font-medium text-xs"
                >
                  {COMMON_REFUND_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason input if 'Other' */}
              {refundReason === "Other adjustment" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label
                    htmlFor="custom-refund-reason"
                    className="block font-bold text-stone-800 dark:text-stone-200"
                  >
                    Specify Reason Detail <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="custom-refund-reason"
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter explicit reason for audit log..."
                    disabled={isRefunding}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-stone-900 dark:text-stone-100 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 text-xs"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setRefundPayment(null)}
                  disabled={isRefunding}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2.5 font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 px-5 py-2.5 font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-xs"
                >
                  {isRefunding ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing Gateway Refund…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Execute Refund</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. PAYMENT DETAIL MODAL ── */}
      {detailPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailPayment(null);
          }}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-5 my-8 text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                      Payment Transaction
                    </h3>
                    <AdminBadge status={detailPayment.status} />
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Processed via {detailPayment.provider.toUpperCase()} • Recorded on{" "}
                    {formatDateTime(detailPayment.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailPayment(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Overview Banner */}
            <div className="rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/70 dark:from-stone-800 dark:to-stone-850 p-4 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-400 block">
                  Total Transaction Amount
                </span>
                <span className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                  {formatCurrency(detailPayment.amount, detailPayment.currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-400 block">
                  Currency
                </span>
                <span className="font-mono text-sm font-bold text-stone-700 dark:text-stone-300">
                  {detailPayment.currency.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Gateway identifiers */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 space-y-2.5">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Gateway Identifiers
                </h4>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                      Internal Payment ID
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono text-xs text-stone-700 dark:text-stone-300">
                        {detailPayment.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(detailPayment.id, "pid")}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                      >
                        {copiedId === "pid" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                      Provider Payment ID
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono text-xs text-stone-700 dark:text-stone-300">
                        {detailPayment.provider_payment_id || "—"}
                      </span>
                      {detailPayment.provider_payment_id && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(detailPayment.provider_payment_id!, "rzp_pid")
                          }
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                        >
                          {copiedId === "rzp_pid" ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                      Provider Order ID
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono text-xs text-stone-700 dark:text-stone-300">
                        {detailPayment.provider_order_id || "—"}
                      </span>
                      {detailPayment.provider_order_id && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(detailPayment.provider_order_id!, "rzp_oid")
                          }
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                        >
                          {copiedId === "rzp_oid" ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Booking Details */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 space-y-2.5">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>Linked Booking</span>
                  {detailPayment.bookings?.id && (
                    <Link
                      href={`/bookings/${detailPayment.bookings.id}`}
                      target="_blank"
                      className="text-rose-700 hover:underline inline-flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <span>Customer View</span>
                      <ExternalLink size={11} />
                    </Link>
                  )}
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Booking Number</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      #{detailPayment.bookings?.booking_number ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Renter</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {detailPayment.bookings?.renter?.full_name ?? "—"}
                    </span>
                  </div>
                  {detailPayment.bookings?.renter?.email && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Renter Email</span>
                      <span className="text-stone-700 dark:text-stone-300">
                        {detailPayment.bookings.renter.email}
                      </span>
                    </div>
                  )}
                  {detailPayment.bookings?.outfit?.title && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Outfit</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[180px]">
                        {detailPayment.bookings.outfit.title}
                      </span>
                    </div>
                  )}
                  {detailPayment.bookings?.rental_start_date && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Rental Window</span>
                      <span className="text-stone-700 dark:text-stone-300">
                        {formatDate(detailPayment.bookings.rental_start_date)} –{" "}
                        {formatDate(detailPayment.bookings.rental_end_date!)}
                      </span>
                    </div>
                  )}
                  {detailPayment.bookings?.security_deposit !== undefined && (
                    <div className="flex justify-between border-t border-stone-100 dark:border-stone-800 pt-1">
                      <span className="text-stone-500">Deposit In Escrow</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {formatCurrency(detailPayment.bookings.security_deposit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Refund History Section (if refunds exist) */}
            {(() => {
              const refunds = Array.isArray(detailPayment.metadata?.refunds)
                ? detailPayment.metadata.refunds
                : [];

              if (refunds.length === 0) return null;

              return (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2.5 text-xs">
                  <h4 className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <RotateCcw size={14} className="text-rose-600" />
                    <span>Refund Records ({refunds.length})</span>
                  </h4>
                  <div className="divide-y divide-rose-100 dark:divide-rose-900/40">
                    {refunds.map((rfnd, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100">
                            {formatCurrency(rfnd.amount)} refunded
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Reason: {rfnd.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-stone-500 block">
                            {rfnd.refund_id}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatDateTime(rfnd.processed_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              {/* Optional Escrow release button if booking is completed */}
              {detailPayment.bookings?.id && (
                <button
                  type="button"
                  onClick={() => handleReleaseEscrow(detailPayment.bookings!.id)}
                  disabled={isPendingEscrow}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 text-xs font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                >
                  <Sparkles size={13} />
                  <span>Release Escrow Hold</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setDetailPayment(null)}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Close
                </button>

                {(detailPayment.status === "successful" ||
                  detailPayment.status === "partially_refunded") && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = detailPayment;
                      setDetailPayment(null);
                      handleOpenRefund(p);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
                  >
                    <RotateCcw size={13} />
                    <span>Initiate Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
