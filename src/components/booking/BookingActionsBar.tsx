"use client";

import { useState } from "react";
import { Sparkles, Printer, MessageCircle, AlertTriangle, ShieldCheck, Shirt } from "lucide-react";
import { OutfitCareModal } from "./OutfitCareModal";
import { RentalInvoiceModal } from "./RentalInvoiceModal";
import { DisputeModal } from "./DisputeModal";
import type { DeliveryAddress, BookingStatus } from "@/types/database";

interface BookingActionsBarProps {
  booking: {
    id: string;
    booking_number: string;
    created_at: string;
    rental_start_date: string;
    rental_end_date: string;
    event_date?: string | null;
    rental_amount: number;
    security_deposit: number;
    delivery_fee: number;
    service_fee: number;
    total_amount: number;
    payment_status: string;
    status: string;
  };
  outfit: {
    title: string;
    brand: string | null;
    city: string | null;
    state: string | null;
  } | null;
  deliveryAddress: DeliveryAddress | null;
}

export function BookingActionsBar({
  booking,
  outfit,
  deliveryAddress,
}: BookingActionsBarProps) {
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const canDispute = [
    "delivered",
    "active",
    "return_scheduled",
    "returned",
    "inspection",
  ].includes(booking.status);

  // Generate WhatsApp support link with pre-filled message
  const waMessage = encodeURIComponent(
    `Hello ShaadiRent Stylist, I need help with my Booking #${booking.booking_number} for "${outfit?.title ?? "Outfit"}".`
  );
  // Default support phone: 919876543210 (or support hotline)
  const waLink = `https://wa.me/919876543210?text=${waMessage}`;

  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Quick Booking Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Care & Wearing Guide */}
          <button
            type="button"
            onClick={() => setIsCareOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 py-2.5 px-3 text-xs font-semibold text-rose-900 transition-colors cursor-pointer"
          >
            <Shirt size={14} className="text-rose-700 shrink-0" />
            <span>Outfit Care Guide</span>
          </button>

          {/* 2. Print / View Invoice */}
          <button
            type="button"
            onClick={() => setIsInvoiceOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 py-2.5 px-3 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
          >
            <Printer size={14} className="text-stone-600 shrink-0" />
            <span>Rental Receipt / Invoice</span>
          </button>

          {/* 3. WhatsApp Concierge */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 py-2.5 px-3 text-xs font-semibold text-emerald-900 transition-colors"
          >
            <MessageCircle size={14} className="text-emerald-700 shrink-0" />
            <span>WhatsApp Stylist</span>
          </a>
        </div>

        {/* Dispute Button if eligible */}
        {canDispute && (
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsDisputeOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
              <span>Report Fit Issue or Damage (Raise Dispute)</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <OutfitCareModal
        isOpen={isCareOpen}
        onClose={() => setIsCareOpen(false)}
        outfitTitle={outfit?.title ?? "Wedding Outfit"}
      />

      <RentalInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={booking}
        outfit={outfit}
        deliveryAddress={deliveryAddress}
      />

      <DisputeModal
        bookingId={booking.id}
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
      />
    </>
  );
}
