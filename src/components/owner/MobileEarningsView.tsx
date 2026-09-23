"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  X,
  ShieldCheck,
  ChevronRight,
  Receipt,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { EarningTransaction, EarningsSummary } from "./EarningsClient";

interface MobileEarningsViewProps {
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

export function MobileEarningsView({ transactions, summary }: MobileEarningsViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeeExplainer, setShowFeeExplainer] = useState(false);

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
        const q = searchQuery.toLowerCase().trim();
        const matchesBooking = t.bookingNumber.toLowerCase().includes(q);
        const matchesOutfit = t.outfit?.title.toLowerCase().includes(q) ?? false;
        const matchesBrand = t.outfit?.brand?.toLowerCase().includes(q) ?? false;
        const matchesRenter = t.renter?.fullName?.toLowerCase().includes(q) ?? false;
        return matchesBooking || matchesOutfit || matchesBrand || matchesRenter;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-rose-50/20 to-[#fdfefe] pb-28 text-gray-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ── 1. HEADER & TOP NAVIGATION ────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
              <Wallet size={10} className="text-emerald-700" />
              <span>Boutique Treasury</span>
            </div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-snug mt-0.5">
              Earnings &amp; Payouts
            </h1>
            <p className="text-[11px] text-gray-500">
              ₹{summary.totalRealized.toLocaleString("en-IN")} settled • ₹{summary.pendingEscrow.toLocaleString("en-IN")} in escrow
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-2xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <span>Dashboard</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* ── 2. HERO PAYOUT BALANCE CARD ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 p-5 text-white shadow-md">
          {/* Subtle Ambient Background Watermark */}
          <div className="pointer-events-none absolute -right-6 -bottom-6 text-white/5">
            <Wallet size={160} />
          </div>

          {/* Top Status Strip */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-rose-200/90 uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-300" />
              Total Realized Earnings
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 backdrop-blur-xs border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Escrow Protected
            </span>
          </div>

          {/* Primary Net Balance */}
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">
                ₹{summary.totalRealized.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-rose-200/80 mt-0.5">
              Net earnings deposited or cleared to your boutique account
            </p>
          </div>

          {/* 2-Stat Split Strip */}
          <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-rose-200/70 block uppercase font-medium">
                This Month
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                ₹{summary.thisMonthRealized.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-blue-200/80 block uppercase font-medium flex items-center gap-1">
                <Clock size={10} />
                In Escrow
              </span>
              <span className="text-sm font-bold text-blue-200 mt-0.5 block">
                ₹{summary.pendingEscrow.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. 2x2 QUICK STATS GRID ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Tile 1: Settled Orders */}
          <div className="rounded-2xl bg-white p-3.5 border border-gray-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Settled Payouts</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-base font-bold text-gray-900">
              {summary.completedCount} Orders
            </p>
            <p className="text-[10px] text-gray-400">Successfully fulfilled</p>
          </div>

          {/* Tile 2: Escrow Buffer */}
          <div className="rounded-2xl bg-white p-3.5 border border-gray-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Escrow Buffer</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <Clock size={14} />
              </div>
            </div>
            <p className="text-base font-bold text-gray-900">
              {summary.escrowBufferDays} Days
            </p>
            <p className="text-[10px] text-gray-400">Post-inspection release</p>
          </div>

          {/* Tile 3: Platform Commission */}
          <div className="rounded-2xl bg-white p-3.5 border border-gray-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Platform Fee</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                <ShieldCheck size={14} />
              </div>
            </div>
            <p className="text-base font-bold text-gray-900">
              {summary.commissionPercent}% Flat
            </p>
            <p className="text-[10px] text-gray-400">You keep {100 - summary.commissionPercent}%</p>
          </div>

          {/* Tile 4: Active Escrow Count */}
          <div className="rounded-2xl bg-white p-3.5 border border-gray-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">Total Bookings</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <Receipt size={14} />
              </div>
            </div>
            <p className="text-base font-bold text-gray-900">
              {summary.totalBookings} Recorded
            </p>
            <p className="text-[10px] text-gray-400">{tabCounts.in_escrow} active in transit</p>
          </div>
        </div>

        {/* ── 4. TRANSPARENT COMMISSION CALCULATOR CARD ──────────────────────── */}
        <div className="rounded-3xl bg-amber-50/80 border border-amber-200/90 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-amber-800 shrink-0" />
              <h3 className="text-xs font-bold text-amber-950">
                Transparent Boutique Split ({summary.commissionPercent}%)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowFeeExplainer(!showFeeExplainer)}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-0.5"
            >
              <span>{showFeeExplainer ? "Hide Details" : "How it works"}</span>
              <ChevronRight
                size={12}
                className={`transition-transform duration-200 ${
                  showFeeExplainer ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          {/* Visual Formula Pill */}
          <div className="flex items-center justify-around rounded-2xl bg-white/90 border border-amber-200/80 py-2.5 px-3 text-xs text-amber-950">
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Gross Rental</span>
              <span className="font-bold text-xs">100%</span>
            </div>
            <span className="text-gray-300 font-bold">−</span>
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-rose-500 block">Platform Fee</span>
              <span className="font-bold text-xs text-rose-700">{summary.commissionPercent}%</span>
            </div>
            <span className="text-gray-300 font-bold">=</span>
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-emerald-600 block">You Receive</span>
              <span className="font-extrabold text-xs text-emerald-800">{100 - summary.commissionPercent}%</span>
            </div>
          </div>

          {/* Expandable Explanation */}
          {showFeeExplainer && (
            <div className="pt-2 text-[11px] text-amber-900/90 leading-relaxed border-t border-amber-200/60 space-y-1.5">
              <p>
                • <strong>Security Deposits (₹)</strong> are held safely in escrow and returned 100% to renters post-inspection with zero platform cuts.
              </p>
              <p>
                • <strong>Escrow Settlement:</strong> Net payout is released automatically to your account {summary.escrowBufferDays} days after successful outfit return inspection.
              </p>
            </div>
          )}
        </div>

        {/* ── 5. INSTANT SEARCH BAR ─────────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking #, outfit title, or renter…"
            className="w-full rounded-2xl bg-white border border-gray-200/90 pl-10 pr-9 py-2.5 text-xs text-gray-900 placeholder-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── 6. INTERACTIVE SEGMENT TABS (Scrollable) ──────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            {
              id: "all" as const,
              label: "All Bookings",
              count: tabCounts.all,
            },
            {
              id: "released" as const,
              label: "Paid Out",
              count: tabCounts.released,
            },
            {
              id: "in_escrow" as const,
              label: "In Escrow",
              count: tabCounts.in_escrow,
            },
            ...(tabCounts.on_hold > 0
              ? [
                  {
                    id: "on_hold" as const,
                    label: "Dispute Hold",
                    count: tabCounts.on_hold,
                  },
                ]
              : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? "bg-rose-900 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 7. TRANSACTIONS LIST ──────────────────────────────────────────── */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center space-y-3 border border-gray-100 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <Receipt size={26} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">
              No transactions found
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {searchQuery
                ? `No transactions match "${searchQuery}". Try clearing search keywords.`
                : `There are no transactions recorded under ${activeTab.replace("_", " ")}.`}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredTransactions.map((tx) => {
              const statusConf =
                PAYOUT_STATUS_CONFIG[tx.payoutStatus] ??
                PAYOUT_STATUS_CONFIG.in_escrow;
              const StatusIcon = statusConf.icon;

              return (
                <div
                  key={tx.id}
                  className="rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3 transition-all"
                >
                  {/* Top Status & Booking Number Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}
                    >
                      <StatusIcon size={11} />
                      <span>{statusConf.label}</span>
                    </span>

                    <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      #{tx.bookingNumber}
                    </span>
                  </div>

                  {/* Outfit Info & Thumbnail */}
                  <div className="flex items-center gap-3">
                    {tx.outfit?.imageUrl ? (
                      <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <Image
                          src={tx.outfit.imageUrl}
                          alt={tx.outfit.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <Receipt size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {tx.outfit?.brand && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {tx.outfit.brand}
                        </p>
                      )}
                      <h3 className="font-bold text-gray-900 text-xs truncate">
                        {tx.outfit?.title ?? "Outfit Booking"}
                      </h3>
                      {tx.renter?.fullName && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <User size={10} />
                          <span>Renter: {tx.renter.fullName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3-Column Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-rose-50/40 p-2.5 border border-rose-100/70 text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">
                        Gross
                      </span>
                      <span className="font-semibold text-gray-700 text-xs mt-0.5 block">
                        ₹{tx.rentalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">
                        Fee ({tx.commissionRate}%)
                      </span>
                      <span className="font-semibold text-rose-700 text-xs mt-0.5 block">
                        −₹{tx.commissionAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block">
                        Net Payout
                      </span>
                      <span className="font-extrabold text-emerald-900 text-xs mt-0.5 block">
                        ₹{tx.netEarning.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Rental Date & Action Link */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="text-gray-400">
                      {fmtDate(tx.rentalStartDate)} – {fmtDate(tx.rentalEndDate)}
                    </span>

                    <Link
                      href={`/requests/${tx.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-rose-900 hover:text-rose-950 text-xs"
                    >
                      <span>Booking Details</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
