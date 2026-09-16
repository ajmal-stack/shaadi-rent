"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Truck,
  PackageCheck,
  ShieldCheck,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { updateBookingStatusAsOwner } from "@/app/actions/booking";
import type { BookingStatus } from "@/types/database";

interface OwnerActionsProps {
  bookingId: string;
  status: BookingStatus;
  customerName?: string;
  deliveryDate: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OwnerActions({
  bookingId,
  status,
  customerName,
  deliveryDate,
}: OwnerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleAction = (newStatus: string, label: string) => {
    setError(null);
    setSuccess(null);
    setPendingAction(newStatus);
    startTransition(async () => {
      const result = await updateBookingStatusAsOwner(
        bookingId,
        newStatus,
        notes.trim() || undefined
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(label);
        setNotes("");
        setTimeout(() => router.refresh(), 1000);
      }
      setPendingAction(null);
    });
  };

  const isLoading = (action: string) => isPending && pendingAction === action;

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
        <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
        <div>
          <p className="font-bold text-emerald-900">{success}</p>
          <p className="text-xs text-emerald-700 mt-0.5">Booking status updated successfully.</p>
        </div>
      </div>
    );
  }

  // ── PENDING: Accept or Reject ──────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-amber-700" />
          </div>
          <div>
            <p className="font-bold text-amber-900">New Booking Request</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {customerName ? `${customerName} wants` : "A customer wants"} to rent this outfit.
              Delivery scheduled for{" "}
              <strong className="text-amber-900">{fmtDate(deliveryDate)}</strong>.
              Accept to confirm, or reject to free up the dates.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleAction("confirmed", "Booking Accepted!")}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3.5 text-sm font-semibold text-white shadow-md hover:from-emerald-700 hover:to-teal-800 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading("confirmed") ? (
              <><Loader2 size={16} className="animate-spin" /><span>Accepting...</span></>
            ) : (
              <><CheckCircle2 size={16} /><span>Accept Booking</span></>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleAction("cancelled", "Booking Rejected")}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading("cancelled") ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <XCircle size={16} />
            )}
            <span>Reject</span>
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIRMED: Pre-delivery inspection — mark outfit ready ───────────────
  if (status === "confirmed") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-blue-700" />
          </div>
          <div>
            <p className="font-bold text-blue-900">Pre-delivery Inspection</p>
            <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
              Inspect the outfit — check the embroidery, fabric condition, and accessories.
              Once ready, mark it for dispatch and a delivery agent will be assigned.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("pickup_scheduled", "Outfit Ready for Dispatch!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 py-3.5 text-sm font-semibold text-white shadow-md hover:from-blue-800 hover:to-indigo-900 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading("pickup_scheduled") ? (
            <><Loader2 size={16} className="animate-spin" /><span>Marking Ready...</span></>
          ) : (
            <><CheckCircle2 size={16} /><span>Outfit Inspected — Ready for Dispatch</span></>
          )}
        </button>
      </div>
    );
  }

  // ── PICKUP_SCHEDULED: Hand over to delivery agent ─────────────────────────
  if (status === "pickup_scheduled") {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
            <Truck size={20} className="text-indigo-700" />
          </div>
          <div>
            <p className="font-bold text-indigo-900">Ready for Dispatch</p>
            <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
              The delivery agent has been assigned. Once you&apos;ve handed over the outfit,
              tap the button to confirm dispatch.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("out_for_delivery", "Outfit Dispatched!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-indigo-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading("out_for_delivery") ? (
            <><Loader2 size={16} className="animate-spin" /><span>Confirming...</span></>
          ) : (
            <><Truck size={16} /><span>I&apos;ve Handed Over the Outfit</span></>
          )}
        </button>
      </div>
    );
  }

  // ── OUT_FOR_DELIVERY: Confirm delivery to customer ────────────────────────
  if (status === "out_for_delivery") {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
            <Truck size={20} className="text-sky-700" />
          </div>
          <div>
            <p className="font-bold text-sky-900">Outfit Out for Delivery</p>
            <p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
              The outfit is on its way to the customer.
              Once your agent has delivered it and the customer has it in hand,
              confirm the delivery here.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("delivered", "Delivery Confirmed!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-700 py-3.5 text-sm font-semibold text-white shadow-md hover:from-sky-700 hover:to-teal-800 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading("delivered") ? (
            <><Loader2 size={16} className="animate-spin" /><span>Confirming...</span></>
          ) : (
            <><PackageCheck size={16} /><span>Confirm — Outfit Delivered to Customer</span></>
          )}
        </button>
      </div>
    );
  }

  // ── RETURN_SCHEDULED: Confirm outfit received back ────────────────────────
  if (status === "return_scheduled") {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
            <PackageCheck size={20} className="text-violet-700" />
          </div>
          <div>
            <p className="font-bold text-violet-900">Return Pickup Incoming</p>
            <p className="text-xs text-violet-800 mt-0.5 leading-relaxed">
              The customer has requested a return pickup.
              Confirm once you have received the outfit back.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("returned", "Outfit Received Back!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-violet-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading("returned") ? (
            <><Loader2 size={16} className="animate-spin" /><span>Confirming...</span></>
          ) : (
            <><PackageCheck size={16} /><span>I&apos;ve Received the Outfit</span></>
          )}
        </button>
      </div>
    );
  }

  // ── RETURNED: Report condition + start inspection ─────────────────────────
  if (status === "returned") {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-orange-700" />
          </div>
          <div>
            <p className="font-bold text-orange-900">Post-Return Inspection</p>
            <p className="text-xs text-orange-800 mt-0.5 leading-relaxed">
              Inspect the outfit for any damage. Add a note below, then submit to trigger
              the inspection workflow and initiate the deposit refund process.
            </p>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Condition notes (e.g. 'Minor stain on hem, no damage to embroidery'). Leave blank if outfit is in perfect condition."
          rows={3}
          className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAction("inspection", "Inspection Started!")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-700 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:from-orange-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading("inspection") ? (
            <><Loader2 size={16} className="animate-spin" /><span>Submitting...</span></>
          ) : (
            <><ClipboardCheck size={16} /><span>Submit Inspection &amp; Initiate Refund</span></>
          )}
        </button>
      </div>
    );
  }

  return null;
}
