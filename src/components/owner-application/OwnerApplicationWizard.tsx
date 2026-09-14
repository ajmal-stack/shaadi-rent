"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { Step1Personal } from "./Step1Personal";
import { Step2MobileOtp } from "./Step2MobileOtp";
import { Step3Identity } from "./Step3Identity";
import { Step4Address } from "./Step4Address";
import { Step5Declaration } from "./Step5Declaration";
import {
  submitOwnerApplicationAction,
  saveApplicationDraftAction,
} from "@/app/(public)/become-an-owner/actions";
import type { ApplicationFormData } from "@/app/(public)/become-an-owner/actions";
import type { OwnerApplication } from "@/types/database";

interface OwnerApplicationWizardProps {
  userId: string;
  userEmail: string;
  initialApplication: OwnerApplication | null;
}

const STEPS = [
  { step: 1, label: "Personal Details" },
  { step: 2, label: "Mobile OTP" },
  { step: 3, label: "Identity Proof" },
  { step: 4, label: "Address" },
  { step: 5, label: "Declaration" },
];

export function OwnerApplicationWizard({
  userId,
  userEmail,
  initialApplication,
}: OwnerApplicationWizardProps) {
  const router = useRouter();

  // Initial step determination
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (initialApplication?.phone_verified) {
      if (initialApplication.id_front_url && initialApplication.id_back_url) {
        if (initialApplication.address_line1 && initialApplication.city) {
          return 5;
        }
        return 4;
      }
      return 3;
    }
    return 1;
  });

  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({
    full_name: initialApplication?.full_name || "",
    email: initialApplication?.email || userEmail,
    phone: initialApplication?.phone || "",
    alt_phone: initialApplication?.alt_phone || undefined,
    dob: initialApplication?.dob || "",
    gender: initialApplication?.gender || "female",
    bio: initialApplication?.bio || undefined,
    phone_verified: initialApplication?.phone_verified || false,
    id_type: initialApplication?.id_type || "aadhaar",
    id_number: initialApplication?.id_number || "",
    id_front_url: initialApplication?.id_front_url || "",
    id_back_url: initialApplication?.id_back_url || "",
    address_line1: initialApplication?.address_line1 || "",
    address_line2: initialApplication?.address_line2 || undefined,
    city: initialApplication?.city || "",
    district: initialApplication?.district || "",
    state: initialApplication?.state || "Delhi",
    pincode: initialApplication?.pincode || "",
    landmark: initialApplication?.landmark || undefined,
    agreed_to_terms: initialApplication?.agreed_to_terms || false,
    declaration_accepted: initialApplication?.declaration_accepted || false,
    signature_name: initialApplication?.signature_name || initialApplication?.full_name || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateFormData(fields: Partial<ApplicationFormData>) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  function handleGoToStep(nextStep: number) {
    setCurrentStep(nextStep);
    // Persist draft safely in the event handler (outside of render)
    saveApplicationDraftAction(formData).catch(() => {});
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitOwnerApplicationAction(formData as ApplicationFormData);
      if (res?.error) {
        setSubmitError(res.error);
        setIsSubmitting(false);
      } else {
        // Navigate cleanly to status page
        router.push("/become-an-owner/status");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit application.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Header bar */}
      <div className="border-b border-stone-200 bg-white sticky top-0 z-20 shadow-2xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/become-an-owner"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Cancel & Back</span>
          </Link>
          <div className="text-right">
            <span className="text-[11px] font-bold text-rose-800 tracking-wider uppercase">
              Owner Onboarding
            </span>
            <p className="text-xs text-stone-500">Step {currentStep} of 5</p>
          </div>
        </div>

        {/* Linear progress line */}
        <div className="w-full bg-stone-100 h-1">
          <div
            className="bg-gradient-to-r from-rose-800 to-amber-600 h-full transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Step Indicator Pills */}
        <div className="mb-8 hidden sm:grid grid-cols-5 gap-2">
          {STEPS.map(({ step, label }) => {
            const isDone = currentStep > step;
            const isCurrent = currentStep === step;

            return (
              <div
                key={step}
                className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-rose-800 bg-white shadow-sm ring-1 ring-rose-800/20"
                    : isDone
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-stone-200 bg-white/60 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-rose-900 text-white"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {isDone ? <Check size={14} /> : step}
                </div>
                <span
                  className={`text-[11px] font-semibold line-clamp-1 ${
                    isCurrent
                      ? "text-rose-950 font-bold"
                      : isDone
                      ? "text-emerald-900"
                      : "text-stone-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Step Card */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-10 shadow-sm">
          {currentStep === 1 && (
            <Step1Personal
              data={formData}
              userEmail={userEmail}
              onUpdate={updateFormData}
              onNext={() => handleGoToStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2MobileOtp
              phone={formData.phone || ""}
              isVerified={formData.phone_verified || false}
              onUpdate={updateFormData}
              onNext={() => handleGoToStep(3)}
              onBack={() => handleGoToStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Identity
              userId={userId}
              data={formData}
              onUpdate={updateFormData}
              onNext={() => handleGoToStep(4)}
              onBack={() => handleGoToStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Address
              data={formData}
              onUpdate={updateFormData}
              onNext={() => handleGoToStep(5)}
              onBack={() => handleGoToStep(3)}
            />
          )}

          {currentStep === 5 && (
            <Step5Declaration
              data={formData}
              onUpdate={updateFormData}
              onSubmit={handleFinalSubmit}
              onBack={() => handleGoToStep(4)}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
