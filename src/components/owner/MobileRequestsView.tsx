"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Search,
  X,
  Phone,
  User,
  Calendar,
  Wallet,
  ArrowRight,
  Check,
} from "lucide-react";

export interface OwnerBookingItem {
  id: string;
  booking_number: string;
  status: string;
  payment_status: string;
  rental_start_date: string;
  rental_end_date: string;
  event_date: string | null;
  total_amount: number;
  created_at: string;
  outfits: { id: string; title: string; brand: string | null } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

interface MobileRequestsViewProps {
  bookings: OwnerBookingItem[];
}

const STATUS_INFO: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; actionLabel: string }
> = {
  pending: {
    label: "New Request",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
    actionLabel: "Review & Accept Request",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: CheckCircle2,
    actionLabel: "View Order Details",
  },
  pickup_scheduled: {
    label: "Pickup Scheduled",
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: CalendarCheck,
    actionLabel: "View Handover Details",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: Truck,
    actionLabel: "Track Delivery Courier",
  },
  delivered: {
    label: "Delivered",
    color: "text-teal-800",
    bg: "bg-teal-50",
    border: "border-teal-200",
    icon: PackageCheck,
    actionLabel: "View Delivery Confirmation",
  },
  active: {
    label: "Active Rental",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: Sparkles,
    actionLabel: "Track Rental & Return Date",
  },
  return_scheduled: {
    label: "Return Incoming",
    color: "text-violet-800",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: CalendarCheck,
    actionLabel: "Pickup Schedule Details",
  },
  returned: {
    label: "Returned",
    color: "text-stone-700",
    bg: "bg-stone-100",
    border: "border-stone-200",
    icon: PackageCheck,
    actionLabel: "Inspect & Release Deposit",
  },
  inspection: {
    label: "Under Inspection",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: ShieldCheck,
    actionLabel: "Complete Garment Inspection",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    actionLabel: "View Completed Receipt",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
    actionLabel: "View Cancellation Reason",
  },
  disputed: {
    label: "Disputed",
    color: "text-orange-900",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertCircle,
    actionLabel: "View Dispute Arbitration",
  },
};

const ACTION_REQUIRED_SET = ["pending", "pickup_scheduled", "return_scheduled", "returned"];
const ACTIVE_STATUSES_SET = ["confirmed", "out_for_delivery", "delivered", "active"];
const COMPLETED_SET = ["completed", "cancelled", "disputed"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function MobileRequestsView({ bookings }: MobileRequestsViewProps) {
  // Counts
  const counts = useMemo(() => {
    const action = bookings.filter((b) => ACTION_REQUIRED_SET.includes(b.status)).length;
    const active = bookings.filter((b) => ACTIVE_STATUSES_SET.includes(b.status)).length;
    const completed = bookings.filter((b) => COMPLETED_SET.includes(b.status)).length;
    return { action, active, completed, all: bookings.length };
  }, [bookings]);

  const [activeTab, setActiveTab] = useState<"action" | "active" | "completed" | "all">(() => {
    const hasAction = bookings.some((b) => ACTION_REQUIRED_SET.includes(b.status));
    return hasAction ? "action" : "all";
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Combined Filtering: Tab + Search Query
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Tab Filter
      if (activeTab === "action" && !ACTION_REQUIRED_SET.includes(b.status)) return false;
      if (activeTab === "active" && !ACTIVE_STATUSES_SET.includes(b.status)) return false;
      if (activeTab === "completed" && !COMPLETED_SET.includes(b.status)) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = b.booking_number?.toLowerCase().includes(q);
        const matchesTitle = b.outfits?.title?.toLowerCase().includes(q);
        const matchesBrand = b.outfits?.brand?.toLowerCase().includes(q);
        const matchesCustomer = b.profiles?.full_name?.toLowerCase().includes(q);
        const matchesPhone = b.profiles?.phone?.includes(q);
        return matchesNumber || matchesTitle || matchesBrand || matchesCustomer || matchesPhone;
      }
      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-rose-50/20 to-[#fdfefe] pb-28 text-gray-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3.5">
        {/* ── 1. HEADER & DASHBOARD LINK ────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 border border-rose-300/60 px-2.5 py-0.5 text-[10px] font-bold text-rose-900">
              <CalendarCheck size={10} className="text-rose-700" />
              <span>Outfit Bookings</span>
            </div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-snug mt-0.5">
              Booking Requests
            </h1>
            <p className="text-[11px] text-gray-500">
              {counts.all} total • {counts.action} require your action
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

        {/* ── 2. INSTANT SEARCH BAR ─────────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking #, outfit title, or customer…"
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

        {/* ── 3. INTERACTIVE SEGMENT TABS (Scrollable) ──────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            {
              id: "action" as const,
              label: "Action Needed",
              count: counts.action,
              highlight: counts.action > 0,
            },
            {
              id: "active" as const,
              label: "Active Rentals",
              count: counts.active,
              highlight: false,
            },
            {
              id: "completed" as const,
              label: "Completed",
              count: counts.completed,
              highlight: false,
            },
            {
              id: "all" as const,
              label: "All Requests",
              count: counts.all,
              highlight: false,
            },
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
                {tab.highlight && !isActive && (
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                )}
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.highlight
                      ? "bg-rose-100 text-rose-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 4. URGENT ACTION ALERT BANNER (If any action needed) ──────────── */}
        {activeTab === "action" && counts.action > 0 && (
          <div className="rounded-3xl bg-amber-50/90 border border-amber-200/90 p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertCircle size={15} className="text-amber-700 shrink-0" />
              <span>{counts.action} Action-Required Bookings</span>
            </div>
            <p className="text-[11px] text-amber-800/80 leading-relaxed pl-5">
              Please review rental dates and accept requests promptly to lock in escrow security and dispatch preparations.
            </p>
          </div>
        )}

        {/* ── 5. REQUEST CARDS LIST ─────────────────────────────────────────── */}
        {filteredBookings.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center space-y-3 border border-gray-100 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <CalendarCheck size={26} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">
              No booking requests found
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {searchQuery
                ? `No requests match "${searchQuery}". Try clearing search keywords.`
                : activeTab === "action"
                ? "All caught up! No bookings currently require your acceptance or handover."
                : `You currently have 0 bookings under ${activeTab}.`}
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
            {filteredBookings.map((booking) => {
              const info = STATUS_INFO[booking.status] ?? STATUS_INFO.pending;
              const StatusIcon = info.icon;
              const needsAction = ACTION_REQUIRED_SET.includes(booking.status);
              const renter = booking.profiles;
              const outfit = booking.outfits;

              return (
                <div
                  key={booking.id}
                  className={`rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border transition-all ${
                    needsAction
                      ? "border-rose-200/90 ring-1 ring-rose-200/50"
                      : "border-gray-100"
                  }`}
                >
                  {/* Top Status & Booking Number Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.bg} ${info.border} ${info.color}`}
                    >
                      <StatusIcon size={11} />
                      {needsAction && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />}
                      <span>{info.label}</span>
                    </span>

                    <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      #{booking.booking_number}
                    </span>
                  </div>

                  {/* Outfit Title & Brand */}
                  <div className="pt-2.5 space-y-1">
                    {outfit?.brand && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {outfit.brand}
                      </p>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">
                      {outfit?.title ?? `Booking #${booking.booking_number}`}
                    </h3>
                  </div>

                  {/* Customer Snippet */}
                  {renter?.full_name && (
                    <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                          <User size={13} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">
                            {renter.full_name}
                          </p>
                          <p className="text-[10px] text-gray-400">Renter</p>
                        </div>
                      </div>
                      {renter.phone && (
                        <span className="text-[11px] font-mono text-gray-600">
                          +91 {renter.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rental Dates & Payout Strip */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-rose-50/40 p-2.5 border border-rose-100/70 text-xs">
                    <div>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar size={11} className="text-rose-800" />
                        <span>Rental Period</span>
                      </p>
                      <p className="font-bold text-gray-800 text-[11px] mt-0.5">
                        {fmtDate(booking.rental_start_date)} — {fmtDate(booking.rental_end_date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                        <Wallet size={11} className="text-emerald-700" />
                        <span>Rental Fee</span>
                      </p>
                      <p className="font-display font-bold text-rose-950 text-sm mt-0.5">
                        ₹{booking.total_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Action Button */}
                  <Link
                    href={`/requests/${booking.id}`}
                    className={`mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                      needsAction
                        ? "bg-gradient-to-r from-rose-800 to-rose-950 text-white shadow-xs hover:from-rose-900 hover:to-rose-950"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    <span>{info.actionLabel}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
