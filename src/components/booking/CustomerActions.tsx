"use client";

import { useState } from "react";
import {
  Sparkles,
  Clock,
  Truck,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { DisputeModal } from "@/components/booking/DisputeModal";
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
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// Customer view is now READ-ONLY — all status changes are done by Admin only.
// Customers can see booking status and raise disputes, but cannot change the flow.

export function CustomerActions({ bookingId, status, returnDate }: CustomerActionsProps) {
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const canDispute = ["delivered", "active", "return_scheduled", "returned", "inspection"].includes(status);

  const configs: Partial<Record<BookingStatus, { icon: React.ElementType; color: string; bg: string; border: string; title: string; message: string }>> = {
    pending: {
      icon: Clock,
      color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
      title: "Booking Awaiting Confirmation",
      message: "Your booking request is being reviewed. You will be notified once it is confirmed by our team.",
    },
    confirmed: {
      icon: Sparkles,
      color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200",
      title: "Booking Confirmed!",
      message: "Great news! Your outfit is reserved and being prepared for dispatch. Our delivery agent will contact you before arrival.",
    },
    pickup_scheduled: {
      icon: Truck,
      color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200",
      title: "Outfit Being Prepared",
      message: "Your outfit is being quality-checked and packed. It will be dispatched to you very soon!",
    },
    out_for_delivery: {
      icon: Truck,
      color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200",
      title: "Your Outfit is on the Way! 🚚",
      message: "Our delivery partner is heading to your address. Keep your phone handy — they'll call before arriving.",
    },
    delivered: {
      icon: PackageCheck,
      color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200",
      title: "Outfit Delivered",
      message: "Your outfit has been delivered. Enjoy your event! Our team will schedule a return pickup after your event date.",
    },
    active: {
      icon: Sparkles,
      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
      title: "Active Rental — Enjoy! 🎉",
      message: (() => {
        const daysLeft = daysUntil(returnDate);
        if (daysLeft < 0) return `Return pickup is overdue by ${Math.abs(daysLeft)} day(s). Please contact support immediately.`;
        if (daysLeft === 0) return `Return pickup is scheduled TODAY (${fmtDate(returnDate)}). Please have the outfit ready.`;
        return `Return pickup is in ${daysLeft} day(s) — ${fmtDate(returnDate)}. Our agent will come to collect the outfit.`;
      })(),
    },
    return_scheduled: {
      icon: RotateCcw,
      color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
      title: "Return Pickup Scheduled",
      message: "Our logistics partner is assigned for pickup. Please keep the outfit packed in its original garment bag.",
    },
    returned: {
      icon: PackageCheck,
      color: "text-stone-600", bg: "bg-stone-50", border: "border-stone-200",
      title: "Outfit Returned",
      message: "We have received your outfit. It will undergo a standard condition check before your security deposit is refunded.",
    },
    inspection: {
      icon: ShieldCheck,
      color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",
      title: "Deposit Refund In Progress",
      message: "Our team is completing the post-return inspection. Your security deposit will be refunded within 2–3 business days.",
    },
  };

  const config = configs[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <>
      <div className={`rounded-2xl border ${config.border} ${config.bg} p-5 space-y-3`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
            <Icon size={20} className={config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900">{config.title}</p>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{config.message}</p>
          </div>
        </div>

        {canDispute && (
          <button
            type="button"
            onClick={() => setIsDisputeOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <AlertTriangle size={13} className="text-amber-600" />
            <span>Report an Issue / Raise Dispute</span>
          </button>
        )}

        {!canDispute && (
          <div className={`flex items-center gap-1.5 text-xs ${config.color} font-medium`}>
            <Info size={12} />
            <span>Need help? Contact ShaadiRent support anytime.</span>
          </div>
        )}
      </div>

      <DisputeModal
        bookingId={bookingId}
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
      />
    </>
  );
}
