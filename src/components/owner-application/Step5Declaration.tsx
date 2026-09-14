"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import { OWNER_DECLARATIONS } from "./constants";
import type { ApplicationFormData } from "@/app/(public)/become-an-owner/actions";

interface Step5Props {
  data: Partial<ApplicationFormData>;
  onUpdate: (fields: Partial<ApplicationFormData>) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export function Step5Declaration({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}: Step5Props) {
  const [agreedTerms, setAgreedTerms] = useState(data.agreed_to_terms || false);
  const [agreedDec, setAgreedDec] = useState(data.declaration_accepted || false);
  const [signature, setSignature] = useState(
    data.signature_name || data.full_name || ""
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedDec) {
      setError("Please check and accept the owner commitments & declarations.");
      return;
    }
    if (!agreedTerms) {
      setError("Please agree to the ShaadiRent Owner Terms and platform policies.");
      return;
    }
    if (!signature.trim()) {
      setError("Digital signature (your full legal name) is required.");
      return;
    }

    setError(null);
    onUpdate({
      agreed_to_terms: true,
      declaration_accepted: true,
      signature_name: signature.trim(),
    });

    await onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          Owner Declaration & Agreement
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Review the marketplace standards and provide your digital signature to submit your application for review.
        </p>
      </div>

      {/* Summary Recap Box */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs tracking-wider uppercase">
          <FileCheck size={16} />
          <span>Application Summary Preview</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <span className="text-stone-400 block">Applicant</span>
            <span className="font-semibold text-stone-800">{data.full_name}</span>
          </div>
          <div>
            <span className="text-stone-400 block">Verified Mobile</span>
            <span className="font-semibold text-stone-800 font-mono">+91 {data.phone}</span>
          </div>
          <div>
            <span className="text-stone-400 block">Identity Document</span>
            <span className="font-semibold text-stone-800 uppercase">
              {data.id_type} (***{data.id_number?.slice(-4)})
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">Pickup Location</span>
            <span className="font-semibold text-stone-800">
              {data.city}, {data.state}
            </span>
          </div>
        </div>
      </div>

      {/* Declarations Checklist */}
      <div className="space-y-3 pt-2">
        <label className="block text-sm font-semibold text-stone-800">
          Owner Commitments & Platform Declarations
        </label>
        <div className="space-y-2.5">
          {OWNER_DECLARATIONS.map((dec) => (
            <div
              key={dec.id}
              className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-start gap-3 shadow-xs"
            >
              <div className="mt-0.5 text-rose-800 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-stone-900">{dec.title}</p>
                <p className="text-xs text-stone-500 leading-relaxed">{dec.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox 1: Declarations */}
        <div
          onClick={() => setAgreedDec(!agreedDec)}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 cursor-pointer transition-colors mt-3"
        >
          <div className="mt-0.5 text-rose-800 shrink-0">
            {agreedDec ? (
              <CheckSquare size={18} className="text-rose-800" />
            ) : (
              <Square size={18} className="text-stone-400" />
            )}
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            I have read and agree to all the above owner commitments. I confirm all provided details and documents are authentic.
          </p>
        </div>

        {/* Checkbox 2: Terms of Service */}
        <div
          onClick={() => setAgreedTerms(!agreedTerms)}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 cursor-pointer transition-colors"
        >
          <div className="mt-0.5 text-rose-800 shrink-0">
            {agreedTerms ? (
              <CheckSquare size={18} className="text-rose-800" />
            ) : (
              <Square size={18} className="text-stone-400" />
            )}
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            I agree to the{" "}
            <span className="font-semibold text-rose-800 underline">ShaadiRent Owner Agreement</span>{" "}
            and acknowledge the 15% platform commission and damage warranty policies.
          </p>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="pt-2">
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Digital Signature <span className="text-rose-600">*</span>
        </label>
        <p className="text-xs text-stone-500 mb-2">
          Type your full legal name below to electronically sign this declaration.
        </p>
        <input
          type="text"
          required
          value={signature}
          onChange={(e) => {
            setSignature(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Priya Sharma"
          className="w-full font-serif italic text-base rounded-xl border border-stone-300 px-4 py-3 text-stone-900 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
        />
        <p className="mt-1 text-[11px] text-stone-400">
          Timestamped and digitally sealed upon submission.
        </p>
      </div>

      {(error || submitError) && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error || submitError}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !agreedTerms || !agreedDec}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 via-rose-900 to-stone-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/25 hover:from-rose-900 hover:to-black hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Submitting Application…</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Submit Application for Review</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
