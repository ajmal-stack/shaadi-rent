"use client";

import { X, Printer, ShieldCheck, Sparkles, MapPin, Calendar, Wallet } from "lucide-react";
import type { DeliveryAddress } from "@/types/database";

interface RentalInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
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

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function RentalInvoiceModal({
  isOpen,
  onClose,
  booking,
  outfit,
  deliveryAddress,
}: RentalInvoiceModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto sleek-scrollbar print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
              💍
            </span>
            <span className="font-display font-bold text-stone-900 text-sm">
              Official Rental Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── PRINTABLE INVOICE CONTENT ── */}
        <div className="space-y-6 font-sans">
          {/* Brand Header & Invoice Reference */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💍</span>
                <span className="font-display text-2xl font-bold tracking-tight text-rose-950">
                  ShaadiRent
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                India&apos;s Premier Wedding Fashion Rental Marketplace
              </p>
              <p className="text-[11px] text-stone-400">
                ShaadiRent Technologies Pvt. Ltd. · support@shaadirent.com
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-900 border border-rose-200">
                Booking #{booking.booking_number}
              </span>
              <p className="text-xs text-stone-500">
                Date: {fmtDate(booking.created_at)}
              </p>
              <p className="text-xs font-bold text-stone-800">
                Status:{" "}
                <span className="capitalize text-emerald-700">
                  {booking.payment_status === "paid" ? "Paid & Verified" : "Pay at Delivery"}
                </span>
              </p>
            </div>
          </div>

          {/* Renter & Delivery Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Delivered To (Renter)
              </span>
              {deliveryAddress ? (
                <>
                  <p className="font-bold text-stone-900 text-sm">
                    {deliveryAddress.full_name}
                  </p>
                  <p className="text-stone-600">+91 {deliveryAddress.phone}</p>
                  <p className="text-stone-600 leading-relaxed">
                    {deliveryAddress.address_line1}
                    {deliveryAddress.address_line2 ? `, ${deliveryAddress.address_line2}` : ""}
                  </p>
                  <p className="text-stone-600">
                    {deliveryAddress.city}, {deliveryAddress.state} — {deliveryAddress.pincode}
                  </p>
                </>
              ) : (
                <p className="text-stone-500 italic">Delivery address recorded on profile</p>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Outfit &amp; Rental Schedule
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {outfit?.title ?? "Wedding Outfit"}
              </p>
              {outfit?.brand && (
                <p className="text-stone-600 font-semibold">{outfit.brand}</p>
              )}
              <div className="pt-2 text-[11px] space-y-0.5 text-stone-600">
                <p>
                  <strong className="text-stone-800">Delivery:</strong> {fmtDate(booking.rental_start_date)}
                </p>
                {booking.event_date && (
                  <p>
                    <strong className="text-rose-900">Event Date:</strong> {fmtDate(booking.event_date)}
                  </p>
                )}
                <p>
                  <strong className="text-stone-800">Pickup:</strong> {fmtDate(booking.rental_end_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Item &amp; Description</th>
                  <th className="py-2.5 px-4 text-center">Rental Period</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-bold text-stone-900">{outfit?.title ?? "Wedding Outfit"}</p>
                    <p className="text-[11px] text-stone-500">
                      Designer wedding couture rental (Sanitized &amp; Steam pressed)
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">4 Days (Standard)</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ₹{booking.rental_amount.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    <p className="font-semibold text-stone-800">Security Deposit</p>
                    <p className="text-[10px] text-emerald-700">100% Refundable post-inspection</p>
                  </td>
                  <td className="py-2.5 px-4 text-center">Refundable</td>
                  <td className="py-2.5 px-4 text-right font-semibold">
                    ₹{booking.security_deposit.toLocaleString("en-IN")}
                  </td>
                </tr>
                {booking.delivery_fee > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-stone-600">Doorstep Delivery &amp; Pickup</td>
                    <td className="py-2 px-4 text-center">Both ways</td>
                    <td className="py-2 px-4 text-right">₹{booking.delivery_fee.toLocaleString("en-IN")}</td>
                  </tr>
                )}
                {booking.service_fee > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-stone-600">Hygienic Sanitization &amp; Insurance</td>
                    <td className="py-2 px-4 text-center">—</td>
                    <td className="py-2 px-4 text-right">₹{booking.service_fee.toLocaleString("en-IN")}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-stone-200 bg-stone-50">
                <tr>
                  <td colSpan={2} className="py-3 px-4 font-bold text-stone-900 text-right">
                    Total Amount
                  </td>
                  <td className="py-3 px-4 font-extrabold text-stone-950 text-right text-sm">
                    ₹{booking.total_amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal / Policy Footer Note */}
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-[11px] text-stone-500 space-y-1">
            <p className="font-bold text-stone-700">Security Deposit Refund Policy:</p>
            <p className="leading-relaxed">
              Your security deposit of ₹{booking.security_deposit.toLocaleString("en-IN")} is held in escrow and will be released to your original payment method within 24–48 hours after our quality team completes the standard post-return hygiene inspection.
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in print) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-800 to-stone-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:from-rose-900 hover:to-black transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
