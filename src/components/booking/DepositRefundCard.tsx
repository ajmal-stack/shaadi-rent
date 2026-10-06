"use client";

import { ShieldCheck, CheckCircle2, Clock, IndianRupee, HelpCircle } from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface DepositRefundCardProps {
  depositAmount: number;
  status: BookingStatus;
  paymentStatus: string;
}

export function DepositRefundCard({
  depositAmount,
  status,
  paymentStatus,
}: DepositRefundCardProps) {
  if (depositAmount <= 0) return null;

  const isCompleted = status === "completed";
  const isInspection = status === "inspection" || status === "returned";

  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Refundable Security Deposit
              </h4>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                {isCompleted ? "Refunded" : "100% Insured"}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Safe Escrow Protection by ShaadiRent
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm sm:text-base font-extrabold text-stone-950 block">
            ₹{depositAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">
            {isCompleted ? "Released to Source" : "Refundable"}
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="rounded-xl bg-white border border-emerald-100 p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600" />
            1. Held in Escrow
          </span>
          <span
            className={`flex items-center gap-1.5 ${
              isInspection || isCompleted ? "text-emerald-800" : "text-stone-400"
            }`}
          >
            {isInspection || isCompleted ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Clock size={13} />
            )}
            2. Return QC
          </span>
          <span
            className={`flex items-center gap-1.5 ${
              isCompleted ? "text-emerald-800" : "text-stone-400"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Clock size={13} />
            )}
            3. Deposit Refunded
          </span>
        </div>

        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{
              width: isCompleted ? "100%" : isInspection ? "66%" : "33%",
            }}
          />
        </div>
      </div>

      {/* Policy reassurance bullet */}
      <p className="text-[11px] text-stone-600 leading-relaxed">
        {isCompleted ? (
          <span className="text-emerald-800 font-semibold">
            ✓ The full security deposit of ₹{depositAmount.toLocaleString("en-IN")} has been released to your original payment method.
          </span>
        ) : (
          <>
            <strong>No Anxiety Guarantee:</strong> Minor fabric wrinkles, normal hem dust, and loose sequins are completely covered. Your deposit is automatically refunded within 24–48 hours after return pickup.
          </>
        )}
      </p>
    </div>
  );
}
