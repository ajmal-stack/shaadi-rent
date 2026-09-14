"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  IndianRupee,
  Info,
  Loader2,
} from "lucide-react";
import { loadDraft, saveDraft } from "@/lib/listing-wizard";
import type { DraftPricing } from "@/lib/listing-wizard";
import { savePricing } from "@/app/(public)/list-your-outfit/actions";

export function PricingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [outfitId, setOutfitId] = useState<string | null>(() => {
    return loadDraft().outfitId;
  });
  const [values, setValues] = useState<Partial<DraftPricing>>(() => {
    return loadDraft().pricing ?? {};
  });

  useEffect(() => {
    if (!outfitId) {
      router.replace("/list-your-outfit/details");
    }
  }, [outfitId, router]);

  function set(field: keyof DraftPricing, val: string) {
    const sanitized = val.replace(/[^0-9.]/g, "");
    setValues((prev) => ({ ...prev, [field]: sanitized }));
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const price = parseFloat(values.rentalPrice || "");
    const deposit = parseFloat(values.securityDeposit || "0");
    const purchase = parseFloat(values.purchasePrice || "0");

    if (!values.rentalPrice || isNaN(price) || price <= 0) {
      errs.rentalPrice = "Please enter a valid rental price greater than ₹0.";
    } else if (price < 100) {
      errs.rentalPrice = "Rental price must be at least ₹100.";
    } else if (price > 500000) {
      errs.rentalPrice = "Rental price seems too high. Please check.";
    }

    if (isNaN(deposit) || deposit < 0) {
      errs.securityDeposit = "Security deposit cannot be negative.";
    } else if (deposit > 1000000) {
      errs.securityDeposit = "Deposit amount seems too high. Please check.";
    }

    if (values.purchasePrice && (isNaN(purchase) || purchase < 0)) {
      errs.purchasePrice = "Purchase price cannot be negative.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outfitId) return;
    if (!validate()) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await savePricing(outfitId, {
        rentalPrice: parseFloat(values.rentalPrice!),
        securityDeposit: parseFloat(values.securityDeposit || "0"),
        purchasePrice: values.purchasePrice
          ? parseFloat(values.purchasePrice)
          : null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const draft = loadDraft();
      saveDraft({
        ...draft,
        stepSaved: Math.max(draft.stepSaved, 4),
        pricing: { ...values } as DraftPricing,
      });

      router.push("/list-your-outfit/availability");
    } finally {
      setIsLoading(false);
    }
  }

  const formattedPreview = values.rentalPrice
    ? `₹${parseFloat(values.rentalPrice).toLocaleString("en-IN")}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Rental Price */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3.5 text-xs text-emerald-900">
          <Info size={15} className="shrink-0 mt-0.5 text-emerald-700" />
          <p>
            <span className="font-semibold">Rental price</span> is what you
            earn for each rental. It doesn&apos;t include the security deposit —
            that&apos;s collected separately and returned to the renter after
            inspection.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="rentalPrice"
            className="block text-xs font-semibold text-stone-700"
          >
            Rental Price (₹) *
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <IndianRupee size={15} className="text-stone-400" />
            </span>
            <input
              id="rentalPrice"
              type="text"
              inputMode="decimal"
              value={values.rentalPrice || ""}
              onChange={(e) => set("rentalPrice", e.target.value)}
              placeholder="e.g. 5000"
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${
                fieldErrors.rentalPrice
                  ? "border-red-400 bg-red-50"
                  : "border-stone-200 bg-stone-50 focus:bg-white"
              }`}
            />
          </div>
          {fieldErrors.rentalPrice && (
            <p className="text-xs text-red-600">{fieldErrors.rentalPrice}</p>
          )}
          {formattedPreview && !fieldErrors.rentalPrice && (
            <p className="text-xs text-emerald-700 font-medium">
              Customers will see: {formattedPreview} per rental
            </p>
          )}
        </div>
      </div>

      {/* Security Deposit */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3.5 text-xs text-amber-900">
          <Info size={15} className="shrink-0 mt-0.5 text-amber-700" />
          <p>
            <span className="font-semibold">Security deposit</span> is held
            separately from the rental. It&apos;s returned to the customer
            after the outfit is safely returned and inspected. It protects you
            against accidental damage.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="securityDeposit"
            className="block text-xs font-semibold text-stone-700"
          >
            Security Deposit (₹)
            <span className="ml-1 font-normal text-stone-400">
              (optional — enter 0 for no deposit)
            </span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <IndianRupee size={15} className="text-stone-400" />
            </span>
            <input
              id="securityDeposit"
              type="text"
              inputMode="decimal"
              value={values.securityDeposit || ""}
              onChange={(e) => set("securityDeposit", e.target.value)}
              placeholder="e.g. 10000"
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${
                fieldErrors.securityDeposit
                  ? "border-red-400 bg-red-50"
                  : "border-stone-200 bg-stone-50 focus:bg-white"
              }`}
            />
          </div>
          {fieldErrors.securityDeposit && (
            <p className="text-xs text-red-600">{fieldErrors.securityDeposit}</p>
          )}
        </div>
      </div>

      {/* Optional: Purchase Price */}
      <div className="rounded-2xl border border-stone-100 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="font-semibold text-stone-900 text-sm border-b border-stone-100 pb-3">
          Original Purchase Price
          <span className="ml-2 text-xs font-normal text-stone-400">(optional)</span>
        </h2>
        <p className="text-xs text-stone-500">
          Helps customers understand the outfit&apos;s value and justifies the rental price. Not shown publicly but used internally.
        </p>
        <div className="space-y-1.5">
          <label
            htmlFor="purchasePrice"
            className="block text-xs font-semibold text-stone-700"
          >
            What did you pay for it? (₹)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <IndianRupee size={15} className="text-stone-400" />
            </span>
            <input
              id="purchasePrice"
              type="text"
              inputMode="decimal"
              value={values.purchasePrice || ""}
              onChange={(e) => set("purchasePrice", e.target.value)}
              placeholder="e.g. 50000"
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${
                fieldErrors.purchasePrice
                  ? "border-red-400 bg-red-50"
                  : "border-stone-200 bg-stone-50 focus:bg-white"
              }`}
            />
          </div>
          {fieldErrors.purchasePrice && (
            <p className="text-xs text-red-600">{fieldErrors.purchasePrice}</p>
          )}
        </div>
      </div>

      {/* Summary preview */}
      {values.rentalPrice && (
        <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 p-5 text-sm space-y-2">
          <p className="font-semibold text-stone-900">Pricing Summary</p>
          <div className="flex items-center justify-between border-b border-rose-100/60 pb-2">
            <span className="text-stone-600">Rental price</span>
            <span className="font-bold text-stone-900">
              ₹{parseFloat(values.rentalPrice).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Security deposit</span>
            <span className="font-medium text-stone-700">
              {values.securityDeposit && parseFloat(values.securityDeposit) > 0
                ? `₹${parseFloat(values.securityDeposit).toLocaleString("en-IN")}`
                : "None"}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
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
          {isLoading ? "Saving…" : "Continue to Availability"}
        </button>
      </div>
    </form>
  );
}
