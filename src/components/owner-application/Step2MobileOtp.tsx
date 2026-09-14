"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { sendOtpAction, verifyOtpAction } from "@/app/(public)/become-an-owner/actions";

interface Step2Props {
  phone: string;
  isVerified: boolean;
  onUpdate: (fields: { phone_verified: boolean }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2MobileOtp({
  phone,
  isVerified,
  onUpdate,
  onNext,
  onBack,
}: Step2Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Trigger initial OTP send if not already verified
  useEffect(() => {
    if (!isVerified && phone) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendOtp() {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await sendOtpAction(phone);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(res.message);
        if (res.devOtp) {
          setDevOtp(res.devOtp);
        }
        setCountdown(30);
      }
    } catch {
      setError("Failed to send OTP. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setError(null);
    setVerifyLoading(true);

    try {
      const res = await verifyOtpAction(phone, otp.trim());
      if (res.error) {
        setError(res.error);
      } else {
        onUpdate({ phone_verified: true });
        setSuccessMsg("Mobile number verified successfully!");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          Mobile Number Verification
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          We sent a 6-digit one-time password to verify your phone number.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 sm:p-6 space-y-5">
        {/* Phone indicator */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-800">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Verification Target</p>
              <p className="text-sm font-bold text-stone-900 font-mono tracking-wide">
                +91 {phone.slice(0, 5)} {phone.slice(5)}
              </p>
            </div>
          </div>

          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Verified Mobile
            </span>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-medium text-rose-700 hover:text-rose-900 hover:underline"
            >
              Edit Number
            </button>
          )}
        </div>

        {/* Development Helper Toast */}
        {devOtp && !isVerified && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 flex items-start gap-3">
            <KeyRound size={18} className="text-amber-700 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs text-amber-900">
              <p className="font-semibold">Demo / Testing Helper:</p>
              <p className="mt-0.5 text-amber-800">
                Your generated verification code is{" "}
                <span className="font-mono font-bold tracking-widest text-amber-950 bg-amber-200/70 px-1.5 py-0.5 rounded">
                  {devOtp}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="mt-2 text-xs font-bold text-amber-800 hover:text-amber-950 underline"
              >
                Auto-fill Code
              </button>
            </div>
          </div>
        )}

        {isVerified ? (
          <div className="py-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-bold text-emerald-900">Phone Confirmed</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your contact number is verified and securely registered for owner notifications and delivery alerts.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  if (error) setError(null);
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.6em] font-mono text-2xl font-bold rounded-xl border border-stone-300 bg-white py-3.5 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && !error && (
              <p className="text-xs text-emerald-700 font-medium">{successMsg}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleSendOtp}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend OTP"}
              </button>

              <button
                type="submit"
                disabled={verifyLoading || otp.length !== 6}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {verifyLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Verify OTP</span>
              </button>
            </div>
          </form>
        )}
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
          type="button"
          disabled={!isVerified}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-stone-950 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Continue to Identity Verification</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
