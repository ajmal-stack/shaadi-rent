"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Loader2, Tag } from "lucide-react";
import { loadDraft, saveDraft } from "@/lib/listing-wizard";
import type { DraftDetails } from "@/lib/listing-wizard";
import {
  createDraftOutfit,
  updateDraftOutfitDetails,
} from "@/app/(public)/list-your-outfit/actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  gender_type: string;
}

interface DetailsFormProps {
  categories: Category[];
}

const CONDITIONS = [
  { value: "like_new", label: "Like New", desc: "Worn once or twice, pristine" },
  { value: "excellent", label: "Excellent", desc: "Minor signs of wear, well maintained" },
  { value: "good", label: "Good", desc: "Gently used, good overall condition" },
] as const;

export function DetailsForm({ categories }: DetailsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state — initialized from localStorage draft on first render
  const [values, setValues] = useState<Partial<DraftDetails>>(() => {
    const draft = loadDraft();
    return draft.details && Object.keys(draft.details).length > 0
      ? { condition: "like_new" as const, ...draft.details }
      : { condition: "like_new" as const };
  });
  const [outfitId, setOutfitId] = useState<string | null>(() => {
    return loadDraft().outfitId;
  });

  const set = (field: keyof DraftDetails, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!values.categoryId) errs.categoryId = "Please select a category.";
    if (!values.title?.trim()) errs.title = "Outfit name is required.";
    else if (values.title.trim().length < 5) errs.title = "Name must be at least 5 characters.";
    if (!values.condition) errs.condition = "Please select a condition.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setError(null);

    try {
      const input = {
        categoryId: values.categoryId!,
        title: values.title!,
        description: values.description || "",
        brand: values.brand || "",
        color: values.color || "",
        size: values.size || "",
        condition: values.condition as "like_new" | "excellent" | "good",
        city: values.city || "",
        district: values.district || "",
        state: values.state || "",
      };

      let newOutfitId = outfitId;

      if (outfitId) {
        // Update existing draft
        const result = await updateDraftOutfitDetails(outfitId, input);
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        // Create new draft
        const result = await createDraftOutfit(input);
        if (result.error || !result.outfitId) {
          setError(result.error ?? "Failed to create outfit.");
          return;
        }
        newOutfitId = result.outfitId;
      }

      // Persist to localStorage
      const draft = loadDraft();
      saveDraft({
        ...draft,
        outfitId: newOutfitId,
        stepSaved: Math.max(draft.stepSaved, 1),
        details: { ...values } as DraftDetails,
      });

      router.push("/list-your-outfit/measurements");
    } finally {
      setIsLoading(false);
    }
  }

  const brideCategories = categories.filter((c) => c.gender_type === "bride");
  const groomCategories = categories.filter((c) => c.gender_type === "groom");
  const unisexCategories = categories.filter((c) => c.gender_type === "unisex");

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Global error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Category ── */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Tag size={16} className="text-rose-700" />
          <h2 className="font-semibold text-stone-900 text-sm sm:text-base">Category *</h2>
        </div>

        {brideCategories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-700">Bride</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brideCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set("categoryId", cat.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all ${
                    values.categoryId === cat.id
                      ? "border-rose-600 bg-rose-50 text-rose-900 shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-rose-300 hover:bg-rose-50/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {groomCategories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">Groom</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {groomCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set("categoryId", cat.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all ${
                    values.categoryId === cat.id
                      ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-300 hover:bg-amber-50/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {unisexCategories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-600">Unisex</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unisexCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set("categoryId", cat.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all ${
                    values.categoryId === cat.id
                      ? "border-stone-700 bg-stone-100 text-stone-900 shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400 hover:bg-stone-100/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {fieldErrors.categoryId && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors.categoryId}</p>
        )}
      </div>

      {/* ── Basic Info ── */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-semibold text-stone-900 text-sm sm:text-base border-b border-stone-100 pb-3">
          Outfit Details *
        </h2>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-semibold text-stone-700">
            Outfit Name *
          </label>
          <input
            id="title"
            type="text"
            value={values.title || ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Royal Red Bridal Lehenga by Sabyasachi"
            maxLength={120}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${
              fieldErrors.title ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50 focus:bg-white"
            }`}
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-xs font-semibold text-stone-700">
            Description
            <span className="ml-1 font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="description"
            value={values.description || ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the outfit — fabric, embroidery, occasion, any alterations possible…"
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all resize-none"
          />
          <p className="text-[11px] text-stone-400 text-right">
            {(values.description || "").length}/2000
          </p>
        </div>

        {/* Brand + Color row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="brand" className="block text-xs font-semibold text-stone-700">
              Brand / Designer
              <span className="ml-1 font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="brand"
              type="text"
              value={values.brand || ""}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Sabyasachi, Manish Malhotra"
              maxLength={80}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="color" className="block text-xs font-semibold text-stone-700">
              Primary Colour
              <span className="ml-1 font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="color"
              type="text"
              value={values.color || ""}
              onChange={(e) => set("color", e.target.value)}
              placeholder="e.g. Deep Red, Ivory, Gold"
              maxLength={60}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label htmlFor="size" className="block text-xs font-semibold text-stone-700">
            Tagged Size
            <span className="ml-1 font-normal text-stone-400">(optional)</span>
          </label>
          <input
            id="size"
            type="text"
            value={values.size || ""}
            onChange={(e) => set("size", e.target.value)}
            placeholder="e.g. S, M, L, XL, Free Size, 36, 38"
            maxLength={30}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ── Condition ── */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-semibold text-stone-900 text-sm sm:text-base border-b border-stone-100 pb-3">
          Outfit Condition *
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("condition", c.value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                values.condition === c.value
                  ? "border-rose-600 bg-rose-50 shadow-sm"
                  : "border-stone-200 bg-stone-50 hover:border-rose-200 hover:bg-rose-50/40"
              }`}
            >
              <p className={`text-sm font-semibold ${values.condition === c.value ? "text-rose-900" : "text-stone-800"}`}>
                {c.label}
              </p>
              <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">{c.desc}</p>
            </button>
          ))}
        </div>
        {fieldErrors.condition && (
          <p className="text-xs text-red-600">{fieldErrors.condition}</p>
        )}
      </div>

      {/* ── Location ── */}
      <div className="rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-semibold text-stone-900 text-sm sm:text-base border-b border-stone-100 pb-3">
          Outfit Location
          <span className="ml-2 text-xs font-normal text-stone-400">(optional)</span>
        </h2>
        <p className="text-xs text-stone-500">
          This helps customers near you discover your outfit. Only city / state level is shown publicly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="city" className="block text-xs font-semibold text-stone-700">City</label>
            <input
              id="city"
              type="text"
              value={values.city || ""}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. Mumbai"
              maxLength={80}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="district" className="block text-xs font-semibold text-stone-700">District</label>
            <input
              id="district"
              type="text"
              value={values.district || ""}
              onChange={(e) => set("district", e.target.value)}
              placeholder="e.g. Thane"
              maxLength={80}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="state" className="block text-xs font-semibold text-stone-700">State</label>
            <input
              id="state"
              type="text"
              value={values.state || ""}
              onChange={(e) => set("state", e.target.value)}
              placeholder="e.g. Maharashtra"
              maxLength={80}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-800 hover:to-rose-950 hover:shadow-md disabled:opacity-60 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={16} />
          )}
          {isLoading ? "Saving…" : "Continue to Measurements"}
        </button>
      </div>
    </form>
  );
}
