import { Ruler, Info, CheckCircle2 } from "lucide-react";

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

export function OutfitMeasurements({
  measurements,
  size,
}: OutfitMeasurementsProps) {
  // Only include measurements that actually exist in the database (strictly non-null and > 0)
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

  return (
    <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
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
              Tagged Size: <strong className="text-stone-900">{size ?? "Standard Fit"}</strong>
            </p>
          </div>
        </div>

        {specs.length > 0 && (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            Inches (in)
          </span>
        )}
      </div>

      {/* Measurement Grid (Real DB numbers only) */}
      {specs.length > 0 ? (
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
            This item is designed with adjustable drapes or flexible standard sizing. No strict tailoring dimensions are required.
          </p>
        </div>
      )}

      {/* Alteration & Backup Guarantee Banner */}
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
            Delivered 48 hours early with an alteration support kit for zero wedding-day stress.
          </p>
        </div>
      </div>
    </div>
  );
}
