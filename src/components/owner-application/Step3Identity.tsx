"use client";

import { useState } from "react";
import { ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, Lock } from "lucide-react";
import { ID_TYPES } from "./constants";
import { DocUploader } from "./DocUploader";
import type { ApplicationFormData } from "@/app/(public)/become-an-owner/actions";

interface Step3Props {
  userId: string;
  data: Partial<ApplicationFormData>;
  onUpdate: (fields: Partial<ApplicationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Identity({
  userId,
  data,
  onUpdate,
  onNext,
  onBack,
}: Step3Props) {
  const [idType, setIdType] = useState<ApplicationFormData["id_type"]>(
    data.id_type || "aadhaar"
  );
  const [idNumber, setIdNumber] = useState(data.id_number || "");
  const [frontUrl, setFrontUrl] = useState(data.id_front_url || "");
  const [backUrl, setBackUrl] = useState(data.id_back_url || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMeta = ID_TYPES.find((t) => t.id === idType) || ID_TYPES[0];

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!idNumber.trim()) {
      errs.idNumber = "Please enter your ID document number.";
    } else if (idType === "aadhaar" && idNumber.replace(/\s/g, "").length !== 12) {
      errs.idNumber = "Aadhaar number must be 12 digits.";
    } else if (idType === "pan" && idNumber.trim().length !== 10) {
      errs.idNumber = "PAN must be 10 characters (e.g. ABCDE1234F).";
    }

    if (!frontUrl) {
      errs.frontUrl = "Front document photo is required.";
    }

    if (!backUrl) {
      errs.backUrl = "Back document photo is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onUpdate({
      id_type: idType,
      id_number: idNumber.trim(),
      id_front_url: frontUrl,
      id_back_url: backUrl,
    });
    onNext();
  }

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          Identity Verification
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Upload a clear government-issued photo ID. This protects our community and ensures trust between owners and renters.
        </p>
      </div>

      {/* Security callout */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 flex items-start gap-3">
        <Lock size={16} className="text-stone-700 mt-0.5 shrink-0" />
        <p className="text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-900">Encrypted & Confidential:</strong> Your documents are stored in a restricted vault, strictly accessed by authorized compliance officers, and never shared publicly.
        </p>
      </div>

      <div className="space-y-5 pt-2">
        {/* ID Type Selection Dropdown */}
        <div className="relative">
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Select Document Type <span className="text-rose-600">*</span>
          </label>

          {/* Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-full text-left rounded-xl border border-stone-200 bg-white px-4 py-3 flex items-center justify-between shadow-2xs hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {selectedMeta.label}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedMeta.hint}
              </p>
            </div>
            <ChevronDown
              size={18}
              className={`text-stone-400 transition-transform duration-200 shrink-0 ml-3 ${isDropdownOpen ? "rotate-180 text-rose-800" : ""
                }`}
            />
          </button>

          {/* Backdrop for closing */}
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}

          {/* Floating Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden divide-y divide-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
              {ID_TYPES.map((t) => {
                const isSelected = idType === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setIdType(t.id as ApplicationFormData["id_type"]);
                      if (errors.idNumber)
                        setErrors((prev) => ({ ...prev, idNumber: "" }));
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors hover:bg-rose-50/60 ${isSelected ? "bg-rose-50/80" : "bg-white"
                      }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-semibold ${isSelected ? "text-rose-900 font-bold" : "text-stone-900"
                          }`}
                      >
                        {t.label}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{t.hint}</p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-rose-800 shrink-0 ml-3" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            {selectedMeta.label} Number <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <ShieldCheck
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value.toUpperCase());
                if (errors.idNumber) setErrors((prev) => ({ ...prev, idNumber: "" }));
              }}
              placeholder={`e.g. ${selectedMeta.example}`}
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 uppercase transition-all ${errors.idNumber ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
                }`}
            />
          </div>
          {errors.idNumber ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={13} /> {errors.idNumber}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-stone-400">{selectedMeta.hint}</p>
          )}
        </div>

        {/* Front & Back Document Uploaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <DocUploader
              label="Front Side Photo"
              description="Ensure photo, name, and ID number are clearly legible."
              userId={userId}
              value={frontUrl}
              onChange={(url) => {
                setFrontUrl(url);
                if (errors.frontUrl) setErrors((prev) => ({ ...prev, frontUrl: "" }));
              }}
              required
            />
            {errors.frontUrl && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.frontUrl}
              </p>
            )}
          </div>

          <div>
            <DocUploader
              label="Back Side Photo"
              description="Showing residential address or issuing authority seal."
              userId={userId}
              value={backUrl}
              onChange={(url) => {
                setBackUrl(url);
                if (errors.backUrl) setErrors((prev) => ({ ...prev, backUrl: "" }));
              }}
              required
            />
            {errors.backUrl && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.backUrl}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-stone-950 hover:shadow-lg transition-all"
        >
          <span>Continue to Address Details</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
