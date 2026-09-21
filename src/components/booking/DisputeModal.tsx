"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  X,
  Loader2,
  ShieldAlert,
  Info,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { createDispute } from "@/app/actions/dispute";

interface DisputeModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  "Item Not Received / Delivery Failed",
  "Garment Damaged or Heavily Stained",
  "Wrong Outfit or Size Delivered",
  "Item Quality / Condition Mismatch",
  "Security Deposit Refund Issue",
  "Other Problem",
];

export function DisputeModal({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalReason = reason === "Other Problem" ? customReason.trim() : reason;
    if (!finalReason) {
      setError("Please specify the reason for raising this dispute.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue in detail so our team can investigate.");
      return;
    }

    const parsedAmount = amount.trim() ? parseFloat(amount.trim()) : undefined;
    if (parsedAmount !== undefined && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setError("Claimed amount must be a valid positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createDispute({
        bookingId,
        reason: finalReason,
        description: description.trim(),
        amount: parsedAmount,
      });

      if (!result.success) {
        setError(result.error || "Failed to submit dispute.");
        toast.error(result.error || "Failed to submit dispute.");
        return;
      }

      toast.success("Dispute raised successfully. Our team will review your case within 24–48 hours.");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl space-y-5 my-8 text-stone-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2
                id="dispute-modal-title"
                className="font-display text-lg font-bold text-stone-900"
              >
                Report a Problem
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Raise a dispute with ShaadiRent resolution desk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Raising a dispute will set your booking status to{" "}
            <strong className="font-semibold text-amber-950">Disputed</strong>{" "}
            and pause automated deposit settlements while our resolution team investigates.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="dispute-reason"
              className="block font-bold text-stone-800"
            >
              Reason for Dispute <span className="text-rose-600">*</span>
            </label>
            <select
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 transition-colors font-medium text-xs"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom reason input if 'Other' */}
          {reason === "Other Problem" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label
                htmlFor="custom-reason"
                className="block font-bold text-stone-800"
              >
                Specify Reason <span className="text-rose-600">*</span>
              </label>
              <input
                id="custom-reason"
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly state the main issue..."
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-900 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 text-xs"
              />
            </div>
          )}

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="dispute-description"
                className="block font-bold text-stone-800"
              >
                Describe What Happened <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-stone-400">
                {description.length}/1000
              </span>
            </div>
            <textarea
              id="dispute-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Provide clear details: when the issue occurred, what condition the garment was in, differences from listing, or what was promised..."
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 p-3 text-stone-900 placeholder:text-stone-400 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Claimed Amount (Optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="dispute-amount"
              className="block font-bold text-stone-800"
            >
              Claimed Refund / Adjustment Amount (Optional)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                <IndianRupee size={13} />
              </div>
              <input
                id="dispute-amount"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1500 (leave blank if full deposit or no specific amount)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-stone-300 pl-8 pr-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700 text-xs"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              Specify the exact amount you are seeking to be reimbursed or deducted.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-stone-200 px-4 py-2.5 font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 px-5 py-2.5 font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Dispute…</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  <span>Submit Dispute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
