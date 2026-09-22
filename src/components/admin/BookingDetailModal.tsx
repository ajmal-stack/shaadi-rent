"use client";

import { useState, useTransition } from "react";
import {
  X,
  CalendarCheck,
  User,
  Package,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Receipt,
  RotateCcw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import type { BookingStatus, BookingPaymentStatus } from "@/types/database";
import {
  adminConfirmBooking,
  adminMarkDelivered,
  adminMarkReturned,
  adminCompleteBooking,
  adminRecordCashPayment,
  adminCancelBooking,
} from "@/app/(admin)/admin/bookings/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingEvent = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

type InspectionReport = {
  id: string;
  inspection_type: string;
  condition_status: string;
  deduction_amount: number | null;
  notes: string | null;
  created_at: string;
};

export type BookingDetailData = {
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
  booking_notes?: string | null;
  outfits: { id: string; title: string } | null;
  renter: { id: string; full_name: string | null; email: string | null; phone?: string | null } | null;
  owner: { id: string; full_name: string | null; email: string | null; phone?: string | null } | null;
  booking_events?: BookingEvent[];
  inspection_reports?: InspectionReport[];
};

interface BookingDetailModalProps {
  booking: BookingDetailData;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<BookingDetailData>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fc(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  pickup_scheduled: "Pickup Scheduled",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  active: "Active",
  return_scheduled: "Return Scheduled",
  returned: "Returned",
  inspection: "Inspection",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
  payment_received: "Payment Received",
  inspection_logged: "Inspection Logged",
  escrow_released: "Escrow Released",
  refund_processed: "Refund Processed",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  inspection: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  disputed: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

// ─── Complete Panel ────────────────────────────────────────────────────────────

function CompletePanel({
  booking,
  onComplete,
  isPending,
}: {
  booking: BookingDetailData;
  onComplete: (action: "full_refund" | "partial_refund" | "no_refund", deduction?: number, notes?: string) => void;
  isPending: boolean;
}) {
  const [depositAction, setDepositAction] = useState<"full_refund" | "partial_refund" | "no_refund">("full_refund");
  const [deduction, setDeduction] = useState("");
  const [notes, setNotes] = useState("");

  const refundAmt = depositAction === "full_refund"
    ? booking.security_deposit
    : depositAction === "partial_refund"
    ? Math.max(0, booking.security_deposit - Number(deduction || 0))
    : 0;

  return (
    <div className="rounded-xl border border-yellow-200 dark:border-yellow-800/60 bg-yellow-50/60 dark:bg-yellow-950/30 p-4 space-y-4">
      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
        <ShieldCheck size={15} /> Close Booking — Deposit Decision
      </p>
      <p className="text-xs text-stone-500">Security deposit: {fc(booking.security_deposit)}</p>

      <div className="space-y-2">
        {(["full_refund", "partial_refund", "no_refund"] as const).map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="depositAction" value={opt} checked={depositAction === opt}
              onChange={() => setDepositAction(opt)} className="accent-yellow-600" />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              {opt === "full_refund" && `Full Refund — ${fc(booking.security_deposit)}`}
              {opt === "partial_refund" && "Partial Refund (damage deduction)"}
              {opt === "no_refund" && "No Refund (damage forfeit)"}
            </span>
          </label>
        ))}
      </div>

      {depositAction === "partial_refund" && (
        <div>
          <label className="text-xs font-medium text-stone-500">Deduction Amount (₹)</label>
          <input type="number" min={0} max={booking.security_deposit} value={deduction}
            onChange={(e) => setDeduction(e.target.value)} placeholder="e.g. 500"
            className="mt-1 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50" />
          {deduction && <p className="text-xs text-stone-400 mt-1">Customer refund: {fc(refundAmt)}</p>}
        </div>
      )}

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder="Optional notes…"
        className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50" />

      <button type="button" disabled={isPending || (depositAction === "partial_refund" && !deduction)}
        onClick={() => onComplete(depositAction, Number(deduction) || undefined, notes)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer">
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        Close Booking
      </button>
    </div>
  );
}

// ─── Cancel Panel ─────────────────────────────────────────────────────────────

function CancelPanel({ onCancel, onDismiss, isPending }: {
  onCancel: (reason: string) => void;
  onDismiss: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={14} /> Cancel Booking
        </p>
        <button onClick={onDismiss} className="text-stone-400 hover:text-stone-600 cursor-pointer"><X size={14} /></button>
      </div>
      <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for cancellation…"
        className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50" />
      <button type="button" disabled={isPending || !reason.trim()} onClick={() => onCancel(reason)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer">
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
        Confirm Cancel
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function BookingDetailModal({ booking: initial, onClose, onUpdate }: BookingDetailModalProps) {
  const [booking, setBooking] = useState(initial);
  const [showCancel, setShowCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateLocal(updates: Partial<BookingDetailData>) {
    setBooking((prev) => ({ ...prev, ...updates }));
    onUpdate(booking.id, updates);
  }

  function run<T extends { success: boolean; error?: string; newStatus?: BookingStatus }>(
    action: () => Promise<T>,
    onSuccess: (res: T) => void,
    successMsg: string
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        onSuccess(res);
        toast.success(successMsg);
      } else {
        toast.error(res.error || "Something went wrong.");
      }
    });
  }

  const s = booking.status;
  const isTerminal = s === "completed" || s === "cancelled";
  const canCancel = !isTerminal && s !== "disputed";

  // Which big action is next?
  const showConfirm = s === "pending";
  const showDelivered = s === "confirmed" || s === "pickup_scheduled" || s === "out_for_delivery";
  const showReturned = s === "active" || s === "delivered" || s === "return_scheduled";
  const showComplete = s === "returned" || s === "inspection";
  const showCash = booking.payment_status === "pending" && !isTerminal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-stone-950 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarCheck size={18} className="text-stone-400" />
              <span className="font-mono text-sm font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                {booking.booking_number}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[booking.status] || "bg-stone-100 text-stone-600"}`}>
                {STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Created {fmtDate(booking.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
              <Package size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">Outfit</p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{booking.outfits?.title ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
              <User size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">Renter</p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{booking.renter?.full_name ?? "—"}</p>
                <p className="text-xs text-stone-500">{booking.renter?.email ?? ""}</p>
                {booking.renter?.phone && <p className="text-xs text-stone-500">{booking.renter.phone}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
              <User size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">Owner</p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{booking.owner?.full_name ?? "—"}</p>
                <p className="text-xs text-stone-500">{booking.owner?.email ?? ""}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
              <CalendarCheck size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">Dates</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{fmtDate(booking.rental_start_date)}</p>
                <p className="text-xs text-stone-500">to {fmtDate(booking.rental_end_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
              <Receipt size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wide">Financials</p>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{fc(booking.total_amount)}</p>
                <p className="text-xs text-stone-500">Deposit: {fc(booking.security_deposit)}</p>
              </div>
            </div>
          </div>

          {/* ─── Actions ──────────────────────────────────────────────── */}
          {!isTerminal && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Actions</p>

              {/* Cash Payment */}
              {showCash && (
                <button type="button" disabled={isPending} onClick={() =>
                  run(() => adminRecordCashPayment(booking.id),
                    () => updateLocal({ payment_status: "paid" }),
                    "Cash payment recorded!")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-60 cursor-pointer">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                  Record Cash Payment — {fc(booking.total_amount)}
                </button>
              )}

              {/* Confirm & Dispatch */}
              {showConfirm && (
                <button type="button" disabled={isPending} onClick={() =>
                  run(() => adminConfirmBooking(booking.id),
                    (res) => updateLocal({ status: res.newStatus || "out_for_delivery" }),
                    "Booking confirmed and dispatched!")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirm & Dispatch Outfit
                </button>
              )}

              {/* Mark Delivered */}
              {showDelivered && (
                <button type="button" disabled={isPending} onClick={() =>
                  run(() => adminMarkDelivered(booking.id),
                    (res) => updateLocal({ status: res.newStatus || "active" }),
                    "Outfit marked as delivered!")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  Mark as Delivered
                </button>
              )}

              {/* Mark Returned */}
              {showReturned && (
                <button type="button" disabled={isPending} onClick={() =>
                  run(() => adminMarkReturned(booking.id),
                    (res) => updateLocal({ status: res.newStatus || "inspection" }),
                    "Outfit marked as returned!")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Outfit Returned — Start Inspection
                </button>
              )}

              {/* Complete */}
              {showComplete && !showCancel && (
                <CompletePanel booking={booking} isPending={isPending}
                  onComplete={(action, deduction, notes) =>
                    run(() => adminCompleteBooking(booking.id, action, deduction, notes),
                      () => updateLocal({ status: "completed" }),
                      "Booking completed!")} />
              )}

              {/* Cancel */}
              {canCancel && !showComplete && !showCancel && (
                <button type="button" onClick={() => setShowCancel(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
                  <XCircle size={14} /> Cancel Booking
                </button>
              )}

              {showCancel && (
                <CancelPanel onDismiss={() => setShowCancel(false)} isPending={isPending}
                  onCancel={(reason) =>
                    run(() => adminCancelBooking(booking.id, reason),
                      () => { updateLocal({ status: "cancelled" }); setShowCancel(false); },
                      "Booking cancelled.")} />
              )}
            </div>
          )}

          {isTerminal && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${booking.status === "completed" ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}>
              {booking.status === "completed" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              This booking is {booking.status}.
            </div>
          )}

          {/* Timeline */}
          {booking.booking_events && booking.booking_events.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Activity Log</p>
              <div className="relative pl-4 border-l-2 border-stone-100 dark:border-stone-800 space-y-4">
                {[...booking.booking_events]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 ring-2 ring-white dark:ring-stone-950" />
                      <div className="flex items-start gap-2">
                        <Clock size={11} className="text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            {STATUS_LABELS[ev.status] || ev.status.replace(/_/g, " ")}
                          </p>
                          {ev.note && <p className="text-xs text-stone-500 mt-0.5">{ev.note}</p>}
                          <p className="text-[11px] text-stone-400 mt-0.5">{fmtDateTime(ev.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
