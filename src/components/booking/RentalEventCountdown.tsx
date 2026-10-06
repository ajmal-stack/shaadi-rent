"use client";

import { useMemo } from "react";
import { Sparkles, Calendar, Truck, Clock, CheckCircle2, Heart } from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface RentalEventCountdownProps {
  status: BookingStatus;
  deliveryDate: string;
  returnDate: string;
  eventDate?: string | null;
}

function daysDiffFromToday(iso: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(iso);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function RentalEventCountdown({
  status,
  deliveryDate,
  returnDate,
  eventDate,
}: RentalEventCountdownProps) {
  const content = useMemo(() => {
    if (status === "cancelled" || status === "disputed") {
      return null;
    }

    if (status === "completed") {
      return {
        icon: Heart,
        bg: "bg-emerald-50 border-emerald-200 text-emerald-950",
        badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        badge: "Celebration Complete",
        title: "Thank you for choosing ShaadiRent!",
        subtitle:
          "We hope your wedding couture made unforgettable memories. All deposits have been refunded.",
      };
    }

    const daysToDelivery = daysDiffFromToday(deliveryDate);
    const daysToEvent = eventDate ? daysDiffFromToday(eventDate) : null;
    const daysToReturn = daysDiffFromToday(returnDate);

    // If active / event day
    if (status === "active" || daysToEvent === 0) {
      return {
        icon: Sparkles,
        bg: "bg-gradient-to-r from-amber-50 via-rose-50 to-pink-50 border-rose-200 text-rose-950",
        badgeBg: "bg-rose-100 text-rose-900 border-rose-200",
        badge: "🎉 Today is The Big Day!",
        title: "Wear your designer couture with pride!",
        subtitle:
          "Enjoy every magical moment of your celebration. No need to worry about dry cleaning — that's on us.",
      };
    }

    // If delivered but before event
    if (status === "delivered" || (daysToDelivery <= 0 && daysToEvent !== null && daysToEvent > 0)) {
      return {
        icon: Calendar,
        bg: "bg-gradient-to-r from-rose-50 to-amber-50/60 border-rose-200 text-stone-900",
        badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
        badge: `${daysToEvent} Day${daysToEvent === 1 ? "" : "s"} to Event`,
        title: `Wedding Celebration in ${daysToEvent} Day${daysToEvent === 1 ? "" : "s"} (${fmtDate(eventDate!)})`,
        subtitle:
          "Outfit is with you! Check the complimentary alteration kit for any quick hook or hem adjustments.",
      };
    }

    // If return scheduled / returned
    if (status === "return_scheduled" || status === "returned" || status === "inspection") {
      return {
        icon: Clock,
        bg: "bg-stone-50 border-stone-200 text-stone-900",
        badgeBg: "bg-stone-200 text-stone-700 border-stone-300",
        badge: daysToReturn <= 0 ? "Pickup Due" : `Pickup in ${daysToReturn} Day${daysToReturn === 1 ? "" : "s"}`,
        title: daysToReturn === 0 ? "Return Pickup Scheduled Today" : `Return Pickup on ${fmtDate(returnDate)}`,
        subtitle:
          "Pack the outfit into the prepaid garment bag with all hangers. Quality check & deposit refund will follow.",
      };
    }

    // Default: Before delivery
    if (daysToDelivery > 0) {
      return {
        icon: Truck,
        bg: "bg-gradient-to-r from-stone-50 via-rose-50/40 to-amber-50/30 border-rose-100 text-stone-900",
        badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
        badge: `Arrives in ${daysToDelivery} Day${daysToDelivery === 1 ? "" : "s"}`,
        title: `Delivery Guaranteed by ${fmtDate(deliveryDate)}`,
        subtitle:
          "We deliver 48 hours early so you can try on the outfit with your bridal/groom jewelry & footwear.",
      };
    }

    return null;
  }, [status, deliveryDate, returnDate, eventDate]);

  if (!content) return null;

  const Icon = content.icon;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${content.bg}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-2xs text-rose-800 shrink-0">
          <Icon size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${content.badgeBg}`}
            >
              {content.badge}
            </span>
          </div>
          <p className="font-display text-sm font-bold mt-1 text-stone-900">
            {content.title}
          </p>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
            {content.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
