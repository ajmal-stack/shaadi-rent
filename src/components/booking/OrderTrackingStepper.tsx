"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Package,
  Star,
  Info,
  Calendar,
} from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface OrderTrackingStepperProps {
  currentStatus: BookingStatus;
  deliveryDate: string;
  returnDate: string;
  eventDate?: string | null;
  securityDeposit?: number;
  bookingNumber?: string;
}

interface StepPhase {
  id: number;
  key: string;
  label: string;
  shortLabel: string;
  subStatuses: BookingStatus[];
  icon: React.ElementType;
  getDescription: (params: {
    status: BookingStatus;
    deliveryDate: string;
    returnDate: string;
    eventDate?: string | null;
    deposit?: number;
  }) => string;
  getDateHint: (params: {
    deliveryDate: string;
    returnDate: string;
    eventDate?: string | null;
  }) => string | null;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

const PHASES: StepPhase[] = [
  {
    id: 1,
    key: "confirmed",
    label: "Order Confirmed",
    shortLabel: "Confirmed",
    subStatuses: ["pending", "confirmed"],
    icon: CheckCircle2,
    getDescription: ({ status }) =>
      status === "pending"
        ? "Payment verified. Awaiting lender confirmation."
        : "Outfit reserved & secured for your celebration dates.",
    getDateHint: () => "Instant",
  },
  {
    id: 2,
    key: "dispatched",
    label: "Sanitized & Dispatched",
    shortLabel: "Dispatched",
    subStatuses: ["pickup_scheduled", "out_for_delivery"],
    icon: Truck,
    getDescription: ({ status, deliveryDate }) =>
      status === "out_for_delivery"
        ? "Courier partner is out for delivery to your address today!"
        : `Hand-inspected, dry-cleaned & packaged for dispatch by ${fmtDate(deliveryDate)}.`,
    getDateHint: ({ deliveryDate }) => `By ${fmtDate(deliveryDate)}`,
  },
  {
    id: 3,
    key: "celebration",
    label: "Delivered & Event Ready",
    shortLabel: "Event Ready",
    subStatuses: ["delivered", "active"],
    icon: Sparkles,
    getDescription: ({ status, eventDate }) =>
      status === "active"
        ? "Your big event day is here! Wear authentic designer couture with pride. 🎉"
        : `Delivered 48 hrs early with complimentary alteration kit for try-on.${
            eventDate ? ` Wedding date: ${fmtDate(eventDate)}.` : ""
          }`,
    getDateHint: ({ eventDate, deliveryDate }) =>
      eventDate ? `Event: ${fmtDate(eventDate)}` : `Arrives: ${fmtDate(deliveryDate)}`,
  },
  {
    id: 4,
    key: "return",
    label: "Return Pickup",
    shortLabel: "Pickup",
    subStatuses: ["return_scheduled", "returned"],
    icon: RotateCcw,
    getDescription: ({ status, returnDate }) =>
      status === "returned"
        ? "Outfit safely collected by logistics partner & in transit to hub."
        : `Prepaid courier will arrive on ${fmtDate(returnDate)}. Pack in the waterproof bag.`,
    getDateHint: ({ returnDate }) => fmtDate(returnDate),
  },
  {
    id: 5,
    key: "completed",
    label: "Refund & Completed",
    shortLabel: "Refunded",
    subStatuses: ["inspection", "completed"],
    icon: ShieldCheck,
    getDescription: ({ status, deposit }) =>
      status === "completed"
        ? `Quality check passed! ₹${deposit?.toLocaleString("en-IN") ?? "0"} deposit refunded.`
        : "Undergoing standard return inspection. Deposit refund will initiate within 24-48 hrs.",
    getDateHint: () => "Post Inspection",
  },
];

// All micro-steps for detailed log
const DETAILED_STEPS: Array<{
  status: BookingStatus;
  title: string;
  desc: string;
  icon: React.ElementType;
}> = [
  { status: "pending", title: "Booking Placed", desc: "Order created and awaiting owner confirmation.", icon: Clock },
  { status: "confirmed", title: "Confirmed & Locked", desc: "Calendar blocked and outfit reserved.", icon: CheckCircle2 },
  { status: "pickup_scheduled", title: "Sanitization & Prep", desc: "Steam ironed and certified hygienic.", icon: ShieldCheck },
  { status: "out_for_delivery", title: "Out for Delivery", desc: "Courier partner en route with live tracking.", icon: Truck },
  { status: "delivered", title: "Delivered to Doorstep", desc: "Received by customer. Ready for trial.", icon: PackageCheck },
  { status: "active", title: "Active Rental / Wedding Day", desc: "Customer celebrating in luxury couture.", icon: Sparkles },
  { status: "return_scheduled", title: "Return Pickup Assigned", desc: "Logistics scheduled to collect outfit.", icon: RotateCcw },
  { status: "returned", title: "Collected by Courier", desc: "Package picked up from doorstep.", icon: Package },
  { status: "inspection", title: "Condition Quality Check", desc: "Inspection for damages or stains.", icon: ShieldCheck },
  { status: "completed", title: "Completed & Refund Released", desc: "Security deposit released back to account.", icon: Star },
];

export function OrderTrackingStepper({
  currentStatus,
  deliveryDate,
  returnDate,
  eventDate,
  securityDeposit = 0,
  bookingNumber,
}: OrderTrackingStepperProps) {
  const [showDetailedLog, setShowDetailedLog] = useState(false);

  // Special states: Cancelled or Disputed
  if (currentStatus === "cancelled") {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 sm:p-6 text-rose-950 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
            <XCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-rose-900">
              Booking Cancelled
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              This rental booking #{bookingNumber ?? ""} has been cancelled. Any payments or
              security deposit collected will be credited back to your original payment
              source within 3–5 business days.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-rose-700">
              Reference: #{bookingNumber ?? "N/A"} · Contact support if you need further help.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "disputed") {
    return (
      <div className="rounded-3xl border border-amber-300 bg-amber-50/80 p-5 sm:p-6 text-amber-950 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-amber-900">
              Dispute Under Active Investigation
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Our ShaadiRent Resolution Desk is currently reviewing the reported issue.
              Both lender and renter details are being verified. We will notify you with the
              official determination within 24 hours.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-amber-700">
              Dispute status details are available in the case card below.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find active phase index (0 to 4)
  const activePhaseIndex = PHASES.findIndex((phase) =>
    phase.subStatuses.includes(currentStatus)
  );

  const activePhase = PHASES[activePhaseIndex] ?? PHASES[0];

  // Calculate percentage for progress bar
  const progressPercent =
    activePhaseIndex === -1
      ? 100
      : Math.round((activePhaseIndex / (PHASES.length - 1)) * 100);

  return (
    <div className="space-y-6">
      {/* ── 1. Modern Horizontal Stepper (Desktop & Tablet) ── */}
      <div className="hidden sm:block">
        <div className="relative pb-2">
          {/* Background Track Line */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-stone-200 rounded-full" />

          {/* Active Gradient Progress Line */}
          <div
            className="absolute top-5 left-8 h-1 bg-gradient-to-r from-rose-700 via-amber-600 to-emerald-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `calc((100% - 4rem) * ${progressPercent / 100})` }}
          />

          {/* Stepper Nodes */}
          <div className="relative flex justify-between items-start">
            {PHASES.map((phase, idx) => {
              const isPast = idx < activePhaseIndex;
              const isCurrent = idx === activePhaseIndex;
              const isFuture = idx > activePhaseIndex;
              const Icon = phase.icon;
              const dateHint = phase.getDateHint({ deliveryDate, returnDate, eventDate });

              return (
                <div
                  key={phase.id}
                  className="flex flex-col items-center text-center max-w-[110px]"
                >
                  {/* Node Circle */}
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                      isPast
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-rose-900 text-white ring-4 ring-rose-200 shadow-md scale-110"
                        : "bg-white text-stone-400 border-2 border-stone-300"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />

                    {/* Ping Indicator for Current Step */}
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`mt-2.5 text-xs tracking-tight ${
                      isCurrent
                        ? "font-extrabold text-rose-950"
                        : isPast
                        ? "font-semibold text-stone-800"
                        : "font-medium text-stone-400"
                    }`}
                  >
                    {phase.shortLabel}
                  </span>

                  {/* Date Badge */}
                  {dateHint && (
                    <span
                      className={`mt-0.5 text-[10px] truncate max-w-[95px] ${
                        isCurrent
                          ? "text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200"
                          : isPast
                          ? "text-stone-500"
                          : "text-stone-400"
                      }`}
                    >
                      {dateHint}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Mobile Compact Step Indicator ── */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-800">
            Step {activePhaseIndex + 1} of 5:{" "}
            <span className="text-rose-900">{activePhase.label}</span>
          </span>
          <span className="text-[11px] font-semibold text-stone-500">
            {progressPercent}% Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className="h-full bg-gradient-to-r from-rose-700 to-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(10, progressPercent)}%` }}
          />
        </div>

        {/* Mobile Mini Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {PHASES.map((phase, idx) => {
            const isCurrent = idx === activePhaseIndex;
            const isPast = idx < activePhaseIndex;
            return (
              <span
                key={phase.id}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap font-semibold border ${
                  isCurrent
                    ? "bg-rose-900 text-white border-rose-900"
                    : isPast
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                }`}
              >
                {phase.shortLabel}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── 3. Active Stage Live Highlight Card ── */}
      <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-800 to-rose-950 text-white shadow-xs shrink-0">
            <activePhase.icon size={20} />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-sm sm:text-base font-bold text-stone-900">
                {activePhase.label}
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-900 border border-rose-200">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                Live Status
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {activePhase.getDescription({
                status: currentStatus,
                deliveryDate,
                returnDate,
                eventDate,
                deposit: securityDeposit,
              })}
            </p>
          </div>
        </div>

        {/* Milestone Timing Strip */}
        <div className="mt-3.5 pt-3 border-t border-rose-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          <div>
            <span className="text-stone-400 block font-medium">Delivery Try-On</span>
            <span className="font-bold text-stone-800">{fmtDate(deliveryDate)}</span>
          </div>
          <div>
            <span className="text-stone-400 block font-medium">Event Celebration</span>
            <span className="font-bold text-stone-800">
              {eventDate ? fmtDate(eventDate) : "Wedding Occasion"}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-stone-400 block font-medium">Return Pickup</span>
            <span className="font-bold text-stone-800">{fmtDate(returnDate)}</span>
          </div>
        </div>
      </div>

      {/* ── 4. Detailed History Accordion Toggle ── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDetailedLog((prev) => !prev)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors cursor-pointer border-t border-stone-100"
        >
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-stone-400" />
            {showDetailedLog ? "Hide Detailed Activity Log" : "View Detailed Tracking Milestones"}
          </span>
          {showDetailedLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetailedLog && (
          <div className="mt-3 space-y-3 rounded-2xl bg-stone-50/70 border border-stone-200/80 p-4 animate-in fade-in duration-200">
            {DETAILED_STEPS.map((step, idx) => {
              const normalStatuses = DETAILED_STEPS.map((s) => s.status);
              const currentStepIdx = normalStatuses.indexOf(currentStatus);
              const isDone = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              const Icon = step.icon;

              return (
                <div
                  key={step.status}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                    isCurrent
                      ? "bg-white border border-rose-200 shadow-2xs"
                      : isDone
                      ? "opacity-80"
                      : "opacity-45"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs shrink-0 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : isCurrent
                        ? "bg-rose-900 text-white"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-rose-950"
                          : isDone
                          ? "text-stone-900"
                          : "text-stone-500"
                      }`}
                    >
                      {step.title}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded">
                          Current Stage
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
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
