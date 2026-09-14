"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { loadDraft, saveDraft } from "@/lib/listing-wizard";
import type { DraftAvailabilityWindow } from "@/lib/listing-wizard";
import { saveAvailability } from "@/app/(public)/list-your-outfit/actions";

type SelectionMode = "available" | "blocked";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateDisplay(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AvailabilityPicker() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outfitId, setOutfitId] = useState<string | null>(() => {
    return loadDraft().outfitId;
  });

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [mode, setMode] = useState<SelectionMode>("available");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [windows, setWindows] = useState<DraftAvailabilityWindow[]>(() => {
    return loadDraft().availability ?? [];
  });

  useEffect(() => {
    if (!outfitId) {
      router.replace("/list-your-outfit/details");
    }
  }, [outfitId, router]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function getDayStatus(iso: string): "available" | "blocked" | null {
    for (const w of windows) {
      if (iso >= w.startDate && iso <= w.endDate) {
        return w.status;
      }
    }
    return null;
  }

  function handleDayClick(iso: string) {
    const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
    if (iso < todayISO) return; // Cannot select past dates

    if (!rangeStart) {
      setRangeStart(iso);
    } else {
      const start = rangeStart < iso ? rangeStart : iso;
      const end = rangeStart < iso ? iso : rangeStart;

      // Check for overlap with existing windows — remove overlaps
      const cleaned = windows.filter(
        (w) => !(w.startDate <= end && w.endDate >= start)
      );

      const newWindow: DraftAvailabilityWindow = {
        startDate: start,
        endDate: end,
        status: mode,
      };

      setWindows([...cleaned, newWindow]);
      setRangeStart(null);
    }
  }

  function removeWindow(idx: number) {
    setWindows((prev) => prev.filter((_, i) => i !== idx));
  }

  function isInRange(iso: string): boolean {
    if (!rangeStart) return false;
    const s = rangeStart < iso ? rangeStart : iso;
    const e = rangeStart < iso ? iso : rangeStart;
    return iso >= s && iso <= e;
  }

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  async function handleSubmit() {
    if (!outfitId) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await saveAvailability(outfitId, windows);
      if (result.error) {
        setError(result.error);
        return;
      }

      const draft = loadDraft();
      saveDraft({
        ...draft,
        stepSaved: Math.max(draft.stepSaved, 5),
        availability: windows,
      });

      router.push("/list-your-outfit/preview");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    const draft = loadDraft();
    saveDraft({ ...draft, stepSaved: Math.max(draft.stepSaved, 5), availability: [] });
    router.push("/list-your-outfit/preview");
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Mode selector */}
      <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <p className="text-xs font-semibold text-stone-700">
          What are you marking?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("available")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              mode === "available"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-stone-200 bg-stone-50 text-stone-600 hover:border-emerald-200"
            }`}
          >
            <CheckCircle2 size={16} className={mode === "available" ? "text-emerald-600" : "text-stone-400"} />
            Available
          </button>
          <button
            type="button"
            onClick={() => setMode("blocked")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              mode === "blocked"
                ? "border-rose-600 bg-rose-50 text-rose-900"
                : "border-stone-200 bg-stone-50 text-stone-600 hover:border-rose-200"
            }`}
          >
            <Ban size={16} className={mode === "blocked" ? "text-rose-600" : "text-stone-400"} />
            Blocked / Busy
          </button>
        </div>
        <p className="text-[11px] text-stone-400 leading-relaxed">
          {mode === "available"
            ? "Mark dates when you can lend the outfit — customers will see these as available."
            : "Mark dates you'll be personally wearing it or it's unavailable."}
          {" "}Click a start date, then an end date to create a range.
        </p>
        {rangeStart && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            <Calendar size={13} />
            <span>
              Range started: <strong>{formatDateDisplay(rangeStart)}</strong> — click an end date
            </span>
            <button
              type="button"
              onClick={() => setRangeStart(null)}
              className="ml-auto text-amber-700 hover:text-amber-900"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display text-base font-bold text-stone-900">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase text-stone-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const iso = toISO(viewYear, viewMonth, day);
            const isPast = iso < todayISO;
            const isToday = iso === todayISO;
            const status = getDayStatus(iso);
            const inRange = isInRange(iso);
            const isStart = rangeStart === iso;

            return (
              <button
                key={day}
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(iso)}
                className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all select-none
                  ${isPast ? "cursor-not-allowed text-stone-300" : "cursor-pointer hover:bg-rose-50"}
                  ${isToday && !status ? "ring-1 ring-rose-300" : ""}
                  ${isStart ? "ring-2 ring-offset-1 ring-rose-600 bg-rose-100 text-rose-900" : ""}
                  ${status === "available" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
                  ${status === "blocked" ? "bg-rose-500 text-white hover:bg-rose-600" : ""}
                  ${inRange && !status ? "bg-amber-100 text-amber-900" : ""}
                  ${!isPast && !status && !inRange && !isStart ? "text-stone-700" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
          <span className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
            Available
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
            Blocked
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span className="h-3 w-3 rounded-full bg-amber-100 border border-amber-300 shrink-0" />
            Selecting
          </span>
        </div>
      </div>

      {/* Added windows */}
      {windows.length > 0 && (
        <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <p className="text-xs font-semibold text-stone-700 border-b border-stone-100 pb-2.5">
            Scheduled Windows ({windows.length})
          </p>
          <div className="space-y-2">
            {windows.map((w, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium ${
                  w.status === "available"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  {w.status === "available" ? (
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Ban size={13} className="text-rose-600 shrink-0" />
                  )}
                  <span className="capitalize font-semibold">{w.status}</span>
                  <span className="font-normal text-inherit/70">
                    {formatDateDisplay(w.startDate)} – {formatDateDisplay(w.endDate)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeWindow(idx)}
                  className="rounded-full p-0.5 hover:bg-black/10 transition-colors shrink-0"
                  aria-label="Remove window"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !outfitId}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-800 hover:to-rose-950 hover:shadow-md disabled:opacity-60 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={16} />
          )}
          {isLoading ? "Saving…" : "Continue to Preview"}
        </button>
      </div>
    </div>
  );
}
