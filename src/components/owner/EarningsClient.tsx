"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  IndianRupee,
  ShieldCheck,
  ExternalLink,
  Receipt,
  HelpCircle,
} from "lucide-react";

export interface EarningTransaction {
  id: string;
  bookingNumber: string;
  rentalStartDate: string;
  rentalEndDate: string;
  eventDate: string | null;
  rentalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netEarning: number;
  bookingStatus: string;
  paymentStatus: string;
  payoutStatus: "released" | "in_escrow" | "on_hold" | "cancelled" | "unpaid";
  createdAt: string;
  updatedAt: string;
  outfit: {
    id: string;
    title: string;
    brand: string | null;
    slug: string;
    imageUrl: string;
  } | null;
  renter: {
    fullName: string | null;
    email: string | null;
  } | null;
}

export interface EarningsSummary {
  totalRealized: number;
  thisMonthRealized: number;
  pendingEscrow: number;
  disputedAmount: number;
  completedCount: number;
  totalBookings: number;
  commissionPercent: number;
  escrowBufferDays: number;
}

interface EarningsClientProps {
  transactions: EarningTransaction[];
  summary: EarningsSummary;
}

type TabKey = "all" | "released" | "in_escrow" | "on_hold";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAYOUT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  released: {
    label: "Paid Out",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  in_escrow: {
    label: "In Escrow",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  on_hold: {
    label: "Dispute Hold",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-stone-600",
    bg: "bg-stone-100",
    border: "border-stone-200",
    icon: XCircle,
  },
  unpaid: {
    label: "Pending Payment",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
};

export function EarningsClient({ transactions, summary }: EarningsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabCounts = useMemo(() => {
    return {
      all: transactions.length,
      released: transactions.filter((t) => t.payoutStatus === "released").length,
      in_escrow: transactions.filter((t) => t.payoutStatus === "in_escrow").length,
      on_hold: transactions.filter((t) => t.payoutStatus === "on_hold").length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === "released" && t.payoutStatus !== "released") return false;
      if (activeTab === "in_escrow" && t.payoutStatus !== "in_escrow") return false;
      if (activeTab === "on_hold" && t.payoutStatus !== "on_hold") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBooking = t.bookingNumber.toLowerCase().includes(q);
        const matchesOutfit = t.outfit?.title.toLowerCase().includes(q) ?? false;
        const matchesBrand = t.outfit?.brand?.toLowerCase().includes(q) ?? false;
        const matchesRenter = t.renter?.fullName?.toLowerCase().includes(q) ?? false;
        if (!matchesBooking && !matchesOutfit && !matchesBrand && !matchesRenter) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 4 Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Realized */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Total Realized
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-950">
              ₹{summary.totalRealized.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Net earnings settled to your account
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 border border-rose-200 text-rose-800">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-rose-950">
              ₹{summary.thisMonthRealized.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Earnings settled in current calendar month
            </p>
          </div>
        </div>

        {/* Pending Escrow */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              In Escrow
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 border border-blue-200 text-blue-800">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-blue-950">
              ₹{summary.pendingEscrow.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              {tabCounts.in_escrow} booking{tabCounts.in_escrow !== 1 ? "s" : ""} pending completion
            </p>
          </div>
        </div>

        {/* Completed Rentals */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-stone-50/50 via-white to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Completed Rentals
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 border border-stone-200 text-stone-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              {summary.completedCount}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Successful orders fulfilled
            </p>
          </div>
        </div>
      </div>

      {/* ── Commission & Payout Policy Banner ── */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-800 shrink-0" />
              <h3 className="text-sm font-bold text-amber-950">
                Transparent Platform Commission ({summary.commissionPercent}%)
              </h3>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Owner payouts are calculated as{" "}
              <strong className="font-semibold text-amber-950">
                Gross Rental Amount − {summary.commissionPercent}% Platform Fee
              </strong>
              . Security deposits (₹) are held safely in escrow and returned to the renter post-inspection without affecting your payout. Funds are released{" "}
              {summary.escrowBufferDays} days after successful inspection.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 rounded-xl bg-white/80 border border-amber-200/70 px-4 py-2.5 text-xs text-amber-950 font-medium">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Gross</span>
              <span className="font-bold">100%</span>
            </div>
            <span className="text-stone-300 font-light">−</span>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Platform</span>
              <span className="font-bold text-rose-700">{summary.commissionPercent}%</span>
            </div>
            <span className="text-stone-300 font-light">=</span>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">You Receive</span>
              <span className="font-extrabold text-emerald-800">{100 - summary.commissionPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls: Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-stone-950 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            All Bookings ({tabCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("released")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "released"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Paid Out ({tabCounts.released})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("in_escrow")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "in_escrow"
                ? "bg-white text-blue-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            In Escrow ({tabCounts.in_escrow})
          </button>
          {tabCounts.on_hold > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("on_hold")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "on_hold"
                  ? "bg-white text-orange-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Disputed ({tabCounts.on_hold})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking # or outfit..."
            className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* ── Transactions List / Table ── */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 mx-auto">
            <Receipt size={24} />
          </div>
          <h4 className="font-display text-base font-bold text-stone-900">
            No Transactions Found
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `No transactions matched "${searchQuery}". Try searching with a different keyword.`
              : activeTab !== "all"
              ? `There are no transactions in the "${activeTab.replace("_", " ")}" category.`
              : "You do not have any booking transactions yet. Once customers rent your outfits, your earnings will appear here."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-rose-800 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/75 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Booking &amp; Outfit</th>
                  <th className="py-3.5 px-4">Rental Dates</th>
                  <th className="py-3.5 px-4 text-right">Gross Rental</th>
                  <th className="py-3.5 px-4 text-right">Platform Fee ({summary.commissionPercent}%)</th>
                  <th className="py-3.5 px-4 text-right">Net Earning</th>
                  <th className="py-3.5 px-5 text-center">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.map((tx) => {
                  const statusConf =
                    PAYOUT_STATUS_CONFIG[tx.payoutStatus] ??
                    PAYOUT_STATUS_CONFIG.in_escrow;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-stone-50/60 transition-colors group"
                    >
                      {/* Booking & Outfit */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {tx.outfit?.imageUrl ? (
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              <Image
                                src={tx.outfit.imageUrl}
                                alt={tx.outfit.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                              <Receipt size={20} />
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-stone-900">
                                #{tx.bookingNumber}
                              </span>
                            </div>
                            <p className="font-semibold text-stone-800 truncate mt-0.5">
                              {tx.outfit?.title ?? "Outfit"}
                            </p>
                            {tx.renter?.fullName && (
                              <p className="text-[11px] text-stone-400">
                                Renter: {tx.renter.fullName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rental Dates */}
                      <td className="py-4 px-4 text-stone-600">
                        <div className="space-y-0.5">
                          <p className="font-medium text-stone-800">
                            {fmtDate(tx.rentalStartDate)} – {fmtDate(tx.rentalEndDate)}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Placed {fmtDate(tx.createdAt)}
                          </p>
                        </div>
                      </td>

                      {/* Gross Rental */}
                      <td className="py-4 px-4 text-right font-medium text-stone-700">
                        ₹{tx.rentalAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Platform Fee */}
                      <td className="py-4 px-4 text-right text-rose-700 font-medium">
                        −₹{tx.commissionAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Net Earning */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-sm text-emerald-950">
                          ₹{tx.netEarning.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Payout Status */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                        >
                          <StatusIcon size={12} />
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-stone-100">
            {filteredTransactions.map((tx) => {
              const statusConf =
                PAYOUT_STATUS_CONFIG[tx.payoutStatus] ??
                PAYOUT_STATUS_CONFIG.in_escrow;
              const StatusIcon = statusConf.icon;

              return (
                <div key={tx.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {tx.outfit?.imageUrl && (
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <Image
                            src={tx.outfit.imageUrl}
                            alt={tx.outfit.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-mono text-xs font-bold text-stone-900 block">
                          #{tx.bookingNumber}
                        </span>
                        <p className="font-semibold text-xs text-stone-800 truncate max-w-[180px]">
                          {tx.outfit?.title ?? "Outfit"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                    >
                      <StatusIcon size={11} />
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 border border-stone-100 p-2.5 text-[11px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Gross</span>
                      <span className="font-medium text-stone-700">₹{tx.rentalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Fee ({tx.commissionRate}%)</span>
                      <span className="font-medium text-rose-700">−₹{tx.commissionAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Net Payout</span>
                      <span className="font-bold text-emerald-950">₹{tx.netEarning.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Rental: {fmtDate(tx.rentalStartDate)} – {fmtDate(tx.rentalEndDate)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
