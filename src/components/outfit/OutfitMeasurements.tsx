"use client";

import { useState, useEffect } from "react";
import { Ruler, Info, CheckCircle2, Sparkles, ChevronDown, AlertCircle, X } from "lucide-react";

export interface MeasurementsData {
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  shoulder?: number | null;
  length?: number | null;
  sleeve_length?: number | null;
  custom_measurements?: Record<string, unknown> | null;
}

interface OutfitMeasurementsProps {
  measurements?: MeasurementsData | null;
  size?: string | null;
}

// ── Fit calculation logic ────────────────────────────────────────────────────
type FitStatus = "perfect" | "minor_alteration" | "tight" | "loose" | "no_data";

interface FitResult {
  status: FitStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

function computeFitResult(
  garmentValue: number | null | undefined,
  userValue: number | null | undefined,
  field: "bust" | "waist" | "hip" | "shoulder" | "length"
): FitResult {
  if (!garmentValue || !userValue) {
    return {
      status: "no_data",
      label: "Enter Your Size",
      description: "Enter your measurement to see the fit prediction.",
      color: "text-stone-400",
      bgColor: "bg-stone-50",
      borderColor: "border-stone-200",
      icon: "—",
    };
  }

  const diff = garmentValue - userValue;

  // Tolerance bands differ slightly by measurement type
  const tightThreshold = field === "shoulder" ? -1.5 : field === "length" ? -3 : -2;
  const perfectLow = field === "length" ? -2 : field === "shoulder" ? -0.5 : 0;
  const perfectHigh = field === "length" ? 3 : field === "shoulder" ? 1 : 2;
  const looseThreshold = field === "length" ? 6 : field === "shoulder" ? 2.5 : 4;

  if (diff < tightThreshold) {
    return {
      status: "tight",
      label: "Too Tight",
      description: `Garment is ${Math.abs(diff).toFixed(1)}" smaller than your measurement. Likely very tight or unsuitable.`,
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: "✗",
    };
  } else if (diff < perfectLow) {
    return {
      status: "minor_alteration",
      label: "Minor Alteration",
      description: `Garment is ${Math.abs(diff).toFixed(1)}" smaller than ideal. A minor tuck or pin adjustment may be needed.`,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: "~",
    };
  } else if (diff <= perfectHigh) {
    return {
      status: "perfect",
      label: "Perfect Fit",
      description: `Within ${Math.abs(diff).toFixed(1)}" of ideal. This will fit you beautifully with no adjustments needed.`,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: "✓",
    };
  } else if (diff <= looseThreshold) {
    return {
      status: "minor_alteration",
      label: "Slightly Loose",
      description: `Garment is ${diff.toFixed(1)}" larger — alteration kit can tuck it in for a perfect silhouette.`,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: "~",
    };
  } else {
    return {
      status: "loose",
      label: "Too Loose",
      description: `Garment is ${diff.toFixed(1)}" larger than your size. Significant tailoring would be needed.`,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: "△",
    };
  }
}

function getOverallVerdict(results: FitResult[]): FitResult | null {
  if (results.length === 0) return null;

  const hasTight = results.some((r) => r.status === "tight");
  const hasLoose = results.some((r) => r.status === "loose");
  const hasAlteration = results.some((r) => r.status === "minor_alteration");
  const allPerfect = results.every((r) => r.status === "perfect");

  if (hasTight) {
    return {
      status: "tight",
      label: "Not Recommended",
      description:
        "At least one key measurement is too small for your body. We recommend choosing a different piece.",
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: "✗",
    };
  } else if (allPerfect) {
    return {
      status: "perfect",
      label: "Ideal Match",
      description:
        "This outfit is a near-perfect match for your measurements. No alterations expected.",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: "✓",
    };
  } else if (hasLoose || hasAlteration) {
    return {
      status: "minor_alteration",
      label: "Minor Alterations Needed",
      description:
        "A small tuck or adjustment will make this outfit fit perfectly. Our complimentary fit kit handles this.",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: "~",
    };
  }
  return null;
}

// ── Fit Bar Component ────────────────────────────────────────────────────────
function FitBar({
  garment,
  user,
  label,
  field,
}: {
  garment: number | null | undefined;
  user: number;
  label: string;
  field: "bust" | "waist" | "hip" | "shoulder" | "length";
}) {
  if (!garment) return null;
  const result = computeFitResult(garment, user, field);
  const percentage = Math.min(100, Math.max(0, (user / garment) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-stone-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-stone-400">
            You: {user}&Prime; / Garment: {garment}&Prime;
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${result.bgColor} ${result.color} border ${result.borderColor}`}
          >
            <span>{result.icon}</span>
            <span>{result.label}</span>
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            result.status === "perfect"
              ? "bg-emerald-500"
              : result.status === "tight"
              ? "bg-red-500"
              : "bg-amber-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── Local storage key for user measurements ──────────────────────────────────
const STORAGE_KEY = "shaadirent_user_measurements";

// ── Main Component ───────────────────────────────────────────────────────────
export function OutfitMeasurements({
  measurements,
  size,
}: OutfitMeasurementsProps) {
  const specs = [
    { label: "Bust / Chest", value: measurements?.bust },
    { label: "Waist", value: measurements?.waist },
    { label: "Hips", value: measurements?.hip },
    { label: "Shoulder", value: measurements?.shoulder },
    { label: "Total Length", value: measurements?.length },
    { label: "Sleeve Length", value: measurements?.sleeve_length },
  ].filter(
    (s): s is { label: string; value: number } =>
      typeof s.value === "number" && s.value > 0
  );

  const customSpecs = measurements?.custom_measurements;
  const marginInches =
    typeof customSpecs?.alteration_margin_inches === "number"
      ? customSpecs.alteration_margin_inches
      : null;

  // ── Fit Checker State ──
  const [fitOpen, setFitOpen] = useState(false);
  const [userBust, setUserBust] = useState("");
  const [userWaist, setUserWaist] = useState("");
  const [userHip, setUserHip] = useState("");
  const [userShoulder, setUserShoulder] = useState("");
  const [userLength, setUserLength] = useState("");
  const [fitChecked, setFitChecked] = useState(false);

  // Load saved measurements from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bust) setUserBust(parsed.bust);
        if (parsed.waist) setUserWaist(parsed.waist);
        if (parsed.hip) setUserHip(parsed.hip);
        if (parsed.shoulder) setUserShoulder(parsed.shoulder);
        if (parsed.length) setUserLength(parsed.length);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToStorage = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bust: userBust,
          waist: userWaist,
          hip: userHip,
          shoulder: userShoulder,
          length: userLength,
        })
      );
    } catch {
      // ignore
    }
  };

  const handleCheckFit = () => {
    saveToStorage();
    setFitChecked(true);
  };

  const handleReset = () => {
    setUserBust("");
    setUserWaist("");
    setUserHip("");
    setUserShoulder("");
    setUserLength("");
    setFitChecked(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Compute fit results for fields that have both garment + user values
  type FitFieldItem = {
    field: "bust" | "waist" | "hip" | "shoulder" | "length";
    label: string;
    garment: number | undefined;
    userRaw: string;
  };

  const rawFitFields: FitFieldItem[] = [
    { field: "bust", label: "Bust / Chest", garment: measurements?.bust ?? undefined, userRaw: userBust },
    { field: "waist", label: "Waist", garment: measurements?.waist ?? undefined, userRaw: userWaist },
    { field: "hip", label: "Hips", garment: measurements?.hip ?? undefined, userRaw: userHip },
    { field: "shoulder", label: "Shoulder Width", garment: measurements?.shoulder ?? undefined, userRaw: userShoulder },
    { field: "length", label: "Total Length", garment: measurements?.length ?? undefined, userRaw: userLength },
  ];

  const fitFields: FitFieldItem[] = rawFitFields.filter((f) => f.garment);

  const activeResults = fitFields
    .filter((f) => {
      const v = parseFloat(f.userRaw);
      return !isNaN(v) && v > 0;
    })
    .map((f) => computeFitResult(f.garment, parseFloat(f.userRaw), f.field));

  const overallVerdict = fitChecked && activeResults.length > 0
    ? getOverallVerdict(activeResults)
    : null;

  const hasMeasurements = specs.length > 0;

  return (
    <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/70 text-rose-800">
            <Ruler size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900">
              Garment Measurements & Fit
            </h3>
            <p className="text-xs text-stone-500">
              Tagged Size:{" "}
              <strong className="text-stone-900">{size ?? "Standard Fit"}</strong>
            </p>
          </div>
        </div>

        {hasMeasurements && (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            Inches (in)
          </span>
        )}
      </div>

      {/* ── Garment Measurements Grid ── */}
      {hasMeasurements ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {specs.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3.5 text-center transition-all hover:bg-stone-50"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                {item.label}
              </p>
              <p className="mt-1 font-display text-lg sm:text-xl font-extrabold text-stone-900">
                {item.value}&Prime;
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4 text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Universal / Standard Sizing ({size ?? "Free Size"})</span>
          </p>
          <p className="text-stone-500 text-[11px] leading-relaxed">
            This item is designed with adjustable drapes or flexible standard
            sizing. No strict tailoring dimensions are required.
          </p>
        </div>
      )}

      {/* ── "Will It Fit Me?" Accordion ── */}
      {hasMeasurements && (
        <div className="rounded-2xl border border-rose-100 overflow-hidden">
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setFitOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-rose-50/80 to-amber-50/60 hover:from-rose-100/60 hover:to-amber-100/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-600 shrink-0" />
              <span className="text-sm font-bold text-stone-900">
                Will It Fit Me?
              </span>
              <span className="text-xs font-medium text-stone-500 hidden sm:inline">
                — Enter your measurements for a fit prediction
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-stone-400 transition-transform duration-200 ${
                fitOpen ? "rotate-180 text-rose-700" : ""
              }`}
            />
          </button>

          {/* Fit checker body */}
          {fitOpen && (
            <div className="px-4 pb-5 pt-4 space-y-5 bg-white border-t border-rose-100/60">
              {/* Overall verdict banner */}
              {overallVerdict && (
                <div
                  className={`rounded-xl border ${overallVerdict.borderColor} ${overallVerdict.bgColor} px-4 py-3 flex items-start gap-3`}
                >
                  <span className={`text-xl font-black ${overallVerdict.color} leading-none mt-0.5 shrink-0`}>
                    {overallVerdict.icon}
                  </span>
                  <div>
                    <p className={`font-bold text-sm ${overallVerdict.color}`}>
                      {overallVerdict.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${overallVerdict.color} opacity-80 leading-relaxed`}>
                      {overallVerdict.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Info note */}
              {!fitChecked && (
                <div className="flex items-start gap-2 text-xs text-stone-500 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <AlertCircle size={13} className="text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    Enter your body measurements in <strong>inches</strong>. We'll
                    compare them against the garment specs to predict the fit. Your
                    measurements are saved locally for future convenience.
                  </span>
                </div>
              )}

              {/* Measurement input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fitFields.map(({ field, label, garment }) => {
                  const setValue = {
                    bust: setUserBust,
                    waist: setUserWaist,
                    hip: setUserHip,
                    shoulder: setUserShoulder,
                    length: setUserLength,
                  }[field];
                  const rawVal = {
                    bust: userBust,
                    waist: userWaist,
                    hip: userHip,
                    shoulder: userShoulder,
                    length: userLength,
                  }[field];

                  const userNum = parseFloat(rawVal);
                  const result = !isNaN(userNum) && userNum > 0 && fitChecked
                    ? computeFitResult(garment, userNum, field)
                    : null;

                  return (
                    <div key={field} className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        {label}
                        <span className="text-stone-400 ml-1 normal-case font-normal">
                          (Garment: {garment}&Prime;)
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="10"
                          max="80"
                          step="0.5"
                          placeholder={`e.g. ${garment}`}
                          value={rawVal}
                          onChange={(e) => {
                            setValue(e.target.value);
                            if (fitChecked) setFitChecked(false);
                          }}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all pr-10 ${
                            result
                              ? result.status === "perfect"
                                ? "border-emerald-300 bg-emerald-50/30"
                                : result.status === "tight"
                                ? "border-red-300 bg-red-50/30"
                                : "border-amber-300 bg-amber-50/30"
                              : "border-stone-200 bg-stone-50/50"
                          }`}
                        />
                        <span className="absolute right-3 text-xs font-semibold text-stone-400 pointer-events-none select-none">
                          in
                        </span>
                      </div>
                      {result && (
                        <p className={`text-[10px] font-semibold ${result.color} flex items-center gap-1`}>
                          <span>{result.icon}</span>
                          <span>{result.label}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Fit bars (shown after checking) */}
              {fitChecked && activeResults.length > 0 && (
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Fit Comparison
                  </p>
                  {fitFields
                    .filter(() => {
                      return true;
                    })
                    .map(({ field, label, garment }) => {
                      const rawVal = {
                        bust: userBust,
                        waist: userWaist,
                        hip: userHip,
                        shoulder: userShoulder,
                        length: userLength,
                      }[field];
                      const userNum = parseFloat(rawVal);
                      if (isNaN(userNum) || userNum <= 0 || !garment) return null;
                      return (
                        <FitBar
                          key={field}
                          field={field}
                          label={label}
                          garment={garment}
                          user={userNum}
                        />
                      );
                    })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCheckFit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3 text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles size={15} className="text-amber-300" />
                  <span>Check Fit</span>
                </button>
                {(userBust || userWaist || userHip || userShoulder || userLength) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Clear measurements"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 px-4 py-3 text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Alteration & Backup Guarantee Banner ── */}
      <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-4 flex items-start gap-3 text-xs text-amber-950">
        <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-900">
            Complimentary Fitting & Alteration Guarantee
          </p>
          <p className="text-amber-800/80 leading-relaxed text-[11px]">
            {marginInches
              ? `This garment includes up to ${marginInches} inches of built-in seam allowance for effortless custom adjustments. `
              : "Every rental includes complimentary emergency fit adjustments. "}
            Delivered 48 hours early with an alteration support kit for zero
            wedding-day stress.
          </p>
        </div>
      </div>
    </div>
  );
}
