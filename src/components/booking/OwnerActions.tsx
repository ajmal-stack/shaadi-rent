"use client";

import {
  Clock,
  Truck,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  PackageCheck,
  Info,
} from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface OwnerActionsProps {
  bookingId: string;
  status: BookingStatus;
  customerName?: string;
  deliveryDate: string;
}

// Owner view is now READ-ONLY — all status changes are done by Admin only.
// This component shows the owner a clear status update for their booking.

export function OwnerActions({ status, customerName, deliveryDate }: OwnerActionsProps) {
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }

  const configs: Partial<Record<BookingStatus, { icon: React.ElementType; color: string; bg: string; border: string; title: string; message: string }>> = {
    pending: {
      icon: Clock,
      color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
      title: "New Booking Request",
      message: `${customerName ? `${customerName} wants` : "A customer wants"} to rent this outfit. Delivery scheduled for ${fmtDate(deliveryDate)}. ShaadiRent admin will confirm and coordinate logistics.`,
    },
    confirmed: {
      icon: CheckCircle2,
      color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200",
      title: "Booking Confirmed",
      message: "This booking is confirmed. Our logistics team will coordinate outfit pickup for delivery.",
    },
    pickup_scheduled: {
      icon: Truck,
      color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200",
      title: "Pickup Scheduled",
      message: "Our delivery agent has been assigned and will pick up the outfit from you soon.",
    },
    out_for_delivery: {
      icon: Truck,
      color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200",
      title: "Outfit Out for Delivery",
      message: "The outfit is on its way to the customer. You will be notified once delivered.",
    },
    delivered: {
      icon: PackageCheck,
      color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200",
      title: "Outfit Delivered",
      message: "The outfit has been delivered to the customer. Rental period is now active.",
    },
    active: {
      icon: Sparkles,
      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
      title: "Active Rental",
      message: "The customer is currently enjoying the outfit. Return pickup will be scheduled by our team after the event.",
    },
    return_scheduled: {
      icon: RotateCcw,
      color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
      title: "Return Pickup Scheduled",
      message: "Our agent will collect the outfit from the customer. You will receive it back after our inspection.",
    },
    returned: {
      icon: PackageCheck,
      color: "text-stone-600", bg: "bg-stone-50", border: "border-stone-200",
      title: "Outfit Returned",
      message: "The outfit has been returned. Our team is conducting a post-return inspection before releasing your payout.",
    },
    inspection: {
      icon: ShieldCheck,
      color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",
      title: "Under Inspection",
      message: "Our team is inspecting the returned outfit. Payout will be released to you after inspection is approved.",
    },
  };

  const config = configs[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-5 space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={config.color} />
        </div>
        <div>
          <p className={`font-bold ${config.color.replace("text-", "text-").replace("-700", "-900").replace("-600", "-900")}`}>
            {config.title}
          </p>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{config.message}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-xs ${config.color} font-medium`}>
        <Info size={12} />
        <span>All booking updates are managed by ShaadiRent admin. Contact support if needed.</span>
      </div>
    </div>
  );
}
