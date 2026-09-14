import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export interface AvailabilityWindow {
  start_date: string;
  end_date: string;
  status: "available" | "blocked" | "maintenance";
}

interface OutfitAvailabilityProps {
  availability?: AvailabilityWindow[] | null;
}

export function OutfitAvailability({
  availability = [],
}: OutfitAvailabilityProps) {
  const availableDates =
    availability?.filter((a) => a.status === "available") ?? [];
  const blockedDates =
    availability?.filter((a) => a.status === "blocked" || a.status === "maintenance") ?? [];

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-5" id="availability-section">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/70 text-rose-800">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-stone-900">
            Rental Availability Schedule
          </h3>
          <p className="text-xs text-stone-500">
            Standard 4-day rental window (Delivered 2 days prior to your event)
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Available Windows */}
        {availableDates.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Verified Open Booking Windows:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((w, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs"
                >
                  <Calendar size={12} className="text-emerald-700" />
                  {formatDate(w.start_date)} &ndash; {formatDate(w.end_date)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Dates */}
        {blockedDates.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-rose-600" />
              <span>Reserved / Unavailable Dates:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((w, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-900 line-through opacity-80"
                >
                  {formatDate(w.start_date)} &ndash; {formatDate(w.end_date)}
                </span>
              ))}
            </div>
          </div>
        )}

        {availableDates.length === 0 && blockedDates.length === 0 && (
          <div className="flex items-center gap-2 text-stone-600">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Open for upcoming wedding reservations. Select your event date to check schedule.</span>
          </div>
        )}
      </div>
    </div>
  );
}
