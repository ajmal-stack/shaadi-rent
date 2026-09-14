"use client";

import { Check } from "lucide-react";
import { WIZARD_STEPS } from "@/lib/listing-wizard";

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="w-full">
      {/* Mobile: compact pill progress */}
      <div className="flex sm:hidden items-center justify-between px-1">
        {WIZARD_STEPS.map((step) => {
          const isDone = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <div
              key={step.number}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? "bg-rose-700 text-white"
                    : isActive
                    ? "bg-rose-900 text-white ring-2 ring-rose-300 ring-offset-1"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-none ${
                  isActive ? "text-rose-900" : isDone ? "text-rose-700" : "text-stone-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal step bar */}
      <div className="hidden sm:flex items-center">
        {WIZARD_STEPS.map((step, idx) => {
          const isDone = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isLast = idx === WIZARD_STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step bubble + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isDone
                      ? "bg-rose-700 text-white"
                      : isActive
                      ? "bg-rose-900 text-white ring-2 ring-rose-300 ring-offset-2"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isDone ? <Check size={15} strokeWidth={3} /> : step.number}
                </div>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    isActive
                      ? "text-rose-900"
                      : isDone
                      ? "text-rose-700"
                      : "text-stone-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all ${
                    currentStep > step.number
                      ? "bg-rose-700"
                      : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Thin progress bar underline */}
      <div className="mt-3 sm:mt-4 h-0.5 w-full rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
