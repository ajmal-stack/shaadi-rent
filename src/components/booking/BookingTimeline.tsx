"use client";

import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Sparkles,
  Calendar,
  ShieldCheck,
  RotateCcw,
  XCircle,
  AlertCircle,
  Package,
  Star,
} from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface TimelineStep {
  status: BookingStatus;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: "pending",
    label: "Booking Pending",
    description: "Your booking request has been placed and is awaiting owner confirmation.",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    status: "confirmed",
    label: "Booking Confirmed",
    description: "Your outfit is reserved! The owner is preparing it for you.",
    icon: CheckCircle2,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    status: "pickup_scheduled",
    label: "Pre-delivery Inspection",
    description: "Our team is inspecting and sanitizing the outfit before dispatch.",
    icon: ShieldCheck,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  {
    status: "out_for_delivery",
    label: "Outfit Dispatched",
    description: "The outfit is on its way to your doorstep!",
    icon: Truck,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  {
    status: "delivered",
    label: "Outfit Delivered",
    description: "Your outfit has been delivered. Confirm receipt to start the rental.",
    icon: PackageCheck,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    status: "active",
    label: "Active Rental — Event Day!",
    description: "Enjoy your outfit for the big day! 🎉",
    icon: Sparkles,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    status: "return_scheduled",
    label: "Return Pickup Scheduled",
    description: "Our agent will collect the outfit from your address.",
    icon: RotateCcw,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    status: "returned",
    label: "Outfit Returned",
    description: "We've received the outfit. It is now undergoing post-return inspection.",
    icon: Package,
    color: "text-stone-600",
    bg: "bg-stone-50",
    border: "border-stone-200",
  },
  {
    status: "inspection",
    label: "Post-return Inspection",
    description: "Quality inspection in progress. Deposit refund will be initiated shortly.",
    icon: ShieldCheck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    status: "completed",
    label: "Booking Completed",
    description: "All done! Security deposit has been refunded. Thank you for choosing ShaadiRent.",
    icon: Star,
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
  },
];

const NORMAL_FLOW_STATUSES = TIMELINE_STEPS.map((s) => s.status);

interface BookingTimelineProps {
  currentStatus: BookingStatus;
  deliveryDate: string;
  returnDate: string;
  eventDate?: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingTimeline({
  currentStatus,
  deliveryDate,
  returnDate,
  eventDate,
}: BookingTimelineProps) {
  const currentIdx = NORMAL_FLOW_STATUSES.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";
  const isDisputed = currentStatus === "disputed";

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
          <XCircle size={24} className="text-rose-600" />
        </div>
        <div>
          <p className="font-bold text-rose-900">Booking Cancelled</p>
          <p className="text-xs text-rose-700 mt-0.5">
            This booking has been cancelled. Any deposit paid will be refunded within 3–5 business days.
          </p>
        </div>
      </div>
    );
  }

  if (isDisputed) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-orange-600" />
        </div>
        <div>
          <p className="font-bold text-orange-900">Dispute Under Review</p>
          <p className="text-xs text-orange-700 mt-0.5">
            Our team is reviewing this dispute. We'll reach out to you within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  // Date hints per step
  const DATE_HINTS: Partial<Record<BookingStatus, string>> = {
    out_for_delivery: `Estimated delivery: ${fmtDate(deliveryDate)}`,
    delivered: `Delivered on: ${fmtDate(deliveryDate)}`,
    active: eventDate ? `Event Day: ${fmtDate(eventDate)}` : undefined,
    return_scheduled: `Return pickup: ${fmtDate(returnDate)}`,
    returned: `Returned: ${fmtDate(returnDate)}`,
  };

  return (
    <div className="relative space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const isDone = currentIdx > i;
        const isCurrent = currentIdx === i;
        const isFuture = currentIdx < i;
        const Icon = step.icon;
        const hint = isCurrent || isDone ? DATE_HINTS[step.status] : undefined;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Left column: icon + connector */}
            <div className="flex flex-col items-center">
              {/* Icon circle */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                    : isCurrent
                    ? `${step.bg} ${step.border} shadow-md`
                    : "bg-stone-100 border-stone-200"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={18} className="text-white" />
                ) : (
                  <Icon
                    size={18}
                    className={isCurrent ? step.color : "text-stone-400"}
                  />
                )}
              </div>
              {/* Vertical connector (not on last item) */}
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[1.5rem] my-1 rounded-full transition-colors duration-300 ${
                    isDone ? "bg-emerald-400" : "bg-stone-200"
                  }`}
                />
              )}
            </div>

            {/* Right column: text */}
            <div className={`pb-5 pt-1.5 flex-1 min-w-0 ${i === TIMELINE_STEPS.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={`text-sm font-bold leading-tight transition-colors ${
                    isDone
                      ? "text-emerald-700 line-through decoration-emerald-400/60"
                      : isCurrent
                      ? "text-stone-900"
                      : "text-stone-400"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${step.bg} ${step.color} ${step.border}`}>
                    ● Current
                  </span>
                )}
                {isDone && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    ✓ Done
                  </span>
                )}
              </div>
              {!isFuture && (
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              )}
              {hint && (
                <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${isCurrent ? step.color : "text-emerald-700"}`}>
                  <Calendar size={10} />
                  {hint}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
