"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Ruler, Loader2, Info } from "lucide-react";
import { loadDraft, saveDraft } from "@/lib/listing-wizard";
import type { DraftMeasurements } from "@/lib/listing-wizard";
import { saveMeasurements } from "@/app/(public)/list-your-outfit/actions";

const MEASUREMENT_FIELDS: Array<{
  key: keyof DraftMeasurements;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    key: "bust",
    label: "Bust / Chest",
    hint: "Measure around the fullest part of the chest",
    placeholder: "e.g. 36",
  },
  {
    key: "waist",
    label: "Waist",
    hint: "Measure around the natural waistline",
    placeholder: "e.g. 28",
  },
  {
    key: "hip",
    label: "Hips",
    hint: "Measure around the fullest part of the hips",
    placeholder: "e.g. 38",
  },
  {
    key: "shoulder",
    label: "Shoulder Width",
    hint: "Measure from shoulder seam to shoulder seam",
    placeholder: "e.g. 14",
  },
  {
    key: "length",
    label: "Total Length",
    hint: "From shoulder/top to hem/bottom",
    placeholder: "e.g. 58",
  },
  {
    key: "sleeve_length",
    label: "Sleeve Length",
    hint: "From shoulder seam to cuff (skip if sleeveless)",
    placeholder: "e.g. 24",
  },
];

export function MeasurementsForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outfitId, setOutfitId] = useState<string | null>(() => {
    const draft = loadDraft();
    return draft.outfitId;
  });
  const [values, setValues] = useState<Partial<DraftMeasurements>>(() => {
    const draft = loadDraft();
    return draft.measurements ?? {};
  });

  useEffect(() => {
    if (!outfitId) {
      router.replace("/list-your-outfit/details");
    }
  }, [outfitId, router]);

  function set(field: keyof DraftMeasurements, val: string) {
    // Allow only numbers and a single decimal point
    const sanitized = val.replace(/[^0-9.]/g, "");
    setValues((prev) => ({ ...prev, [field]: sanitized }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outfitId) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await saveMeasurements(outfitId, {
        bust: values.bust || "",
        waist: values.waist || "",
        hip: values.hip || "",
        shoulder: values.shoulder || "",
        length: values.length || "",
        sleeve_length: values.sleeve_length || "",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Persist to localStorage
      const draft = loadDraft();
      saveDraft({
        ...draft,
        stepSaved: Math.max(draft.stepSaved, 2),
        measurements: values as DraftMeasurements,
      });

      router.push("/list-your-outfit/photos");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    // Measurements are optional — save empty and continue
    const draft = loadDraft();
    saveDraft({ ...draft, stepSaved: Math.max(draft.stepSaved, 2), measurements: {} });
    router.push("/list-your-outfit/photos");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3.5 text-xs text-amber-900">
        <Info size={15} className="shrink-0 mt-0.5 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-900">All measurements are in inches.</p>
          <p className="mt-0.5 text-amber-800/80 leading-relaxed">
            Accurate measurements help customers find the right fit and reduce
            returns. All fields are optional — skip any that don&apos;t apply to
            your outfit.
          </p>
        </div>
      </div>

      {/* Measurement fields */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-5">
          <Ruler size={16} className="text-rose-700" />
          <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
            Garment Measurements
            <span className="ml-2 text-xs font-normal text-stone-400">(all optional)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {MEASUREMENT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label
                htmlFor={field.key}
                className="block text-xs font-semibold text-stone-700"
              >
                {field.label}
                <span className="ml-1 font-normal text-stone-400">(inches)</span>
              </label>
              <div className="relative">
                <input
                  id={field.key}
                  type="text"
                  inputMode="decimal"
                  value={values[field.key] || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-12 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                  in
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {field.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Skip for now
        </button>
        <button
          type="submit"
          disabled={isLoading || !outfitId}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-800 hover:to-rose-950 hover:shadow-md disabled:opacity-60 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={16} />
          )}
          {isLoading ? "Saving…" : "Continue to Photos"}
        </button>
      </div>
    </form>
  );
}
