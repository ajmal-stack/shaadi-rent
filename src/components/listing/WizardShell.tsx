"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WizardProgress } from "./WizardProgress";
import { WIZARD_STEPS } from "@/lib/listing-wizard";

interface WizardShellProps {
  currentStep: number;
  children: ReactNode;
  /** Optional title override — defaults to step label */
  title?: string;
  subtitle?: string;
}

export function WizardShell({
  currentStep,
  children,
  title,
  subtitle,
}: WizardShellProps) {
  const stepMeta = WIZARD_STEPS.find((s) => s.number === currentStep);
  const displayTitle = title ?? stepMeta?.label ?? "";
  const prevStep = WIZARD_STEPS.find((s) => s.number === currentStep - 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-rose-50/20 to-white pb-24">
      {/* Sticky top wizard header */}
      <div className="sticky top-[56px] sm:top-[72px] z-20 border-b border-rose-100/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-5">
          {/* Back nav + Step label row */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            {prevStep ? (
              <Link
                href={prevStep.href}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-rose-800 hover:text-rose-900 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Back to {prevStep.label}</span>
                <span className="sm:hidden">Back</span>
              </Link>
            ) : (
              <Link
                href="/rent-your-outfit"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </Link>
            )}

            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              Step {currentStep} of {WIZARD_STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <WizardProgress currentStep={currentStep} />
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Section heading */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-rose-950">
            {displayTitle}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
