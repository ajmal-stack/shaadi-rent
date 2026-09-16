"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
} from "lucide-react";
import { updateBookingStatus } from "@/app/actions/booking";
import type { BookingStatus } from "@/types/database";

interface CustomerActionsProps {
  bookingId: string;
  status: BookingStatus;
  returnDate: string;
}

function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CustomerActions({ bookingId, status, returnDate }: CustomerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = (newStatus: string, successMsg: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, newStatus);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(successMsg);
        // Refresh the page data after 1.2s to show updated status
        setTimeout(() => router.refresh(), 1200);
      }
    });
  };

  // ── "Out for delivery" — informational banner ──────────────────────────────
  if (status === "out_for_delivery") {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-sky-600" />
          </div>
          <div>
            <p className="font-bold text-sky-900">Your outfit is on the way! 🚚</p>
            <p className="text-xs text-sky-800 mt-1 leading-relaxed">
              Our delivery partner is heading to your address. Keep your phone handy — they'll call before arriving.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── "Delivered" — customer confirms receipt ────────────────────────────────
  if (status === "delivered") {
    if (success) {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900">Receipt Confirmed!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your rental is now active. Enjoy the outfit! 🎉</p>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
            <PackageCheck size={20} className="text-teal-700" />
          </div>
          <div>
            <p className="font-bold text-teal-900">Outfit Delivered to You</p>
            <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">
              Did you receive your outfit? Confirm receipt to start your active rental and enable return scheduling.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("active", "Receipt confirmed! Rental is now active.")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-teal-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /><span>Confirming…</span></>
          ) : (
            <><PackageCheck size={16} /><span>Yes, I&apos;ve Received My Outfit</span></>
          )}
        </button>
      </div>
    );
  }

  // ── "Active" — countdown to return + schedule return ──────────────────────
  if (status === "active") {
    const daysLeft = daysUntil(returnDate);
    const isOverdue = daysLeft < 0;
    const isDueToday = daysLeft === 0;

    if (success) {
      return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-violet-600 shrink-0" />
          <div>
            <p className="font-bold text-violet-900">Return Pickup Scheduled!</p>
            <p className="text-xs text-violet-700 mt-0.5">Our agent will collect the outfit from your address.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
        {/* Rental duration indicator */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
            <Clock size={20} className={isOverdue ? "text-rose-600" : "text-emerald-700"} />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Active Rental</p>
            <p className={`text-xs mt-0.5 font-semibold ${isOverdue ? "text-rose-700" : isDueToday ? "text-amber-700" : "text-emerald-700"}`}>
              {isOverdue
                ? `Return is overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}. Please schedule pickup immediately.`
                : isDueToday
                ? `Return pickup is due TODAY (${fmtDate(returnDate)})`
                : `Return pickup due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — ${fmtDate(returnDate)}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("return_scheduled", "Return pickup scheduled!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-violet-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /><span>Scheduling…</span></>
          ) : (
            <><RotateCcw size={16} /><span>Schedule Return Pickup</span></>
          )}
        </button>
      </div>
    );
  }

  // ── "Inspection" — reassurance banner ─────────────────────────────────────
  if (status === "inspection") {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-orange-600" />
        </div>
        <div>
          <p className="font-bold text-orange-900">Deposit Refund In Progress</p>
          <p className="text-xs text-orange-800 mt-1 leading-relaxed">
            Our team is completing the post-return inspection. Your security deposit will be refunded within 2–3 business days.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
