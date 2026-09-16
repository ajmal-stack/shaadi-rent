"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Calendar as CalendarIcon,
} from "lucide-react";

export type CalendarMode = "single" | "range";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface CustomCalendarProps {
  mode?: "single";
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
  highlightDates?: Date[];
  className?: string;
  showPresets?: boolean;
  rentalDurationDays?: number; // Auto-select end date based on rental duration (e.g., 3 or 7 days)
}

export interface CustomCalendarRangeProps {
  mode: "range";
  selected?: DateRange;
  onSelect?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
  highlightDates?: Date[];
  className?: string;
  showPresets?: boolean;
  rentalDurationDays?: number;
}

export type CalendarProps = CustomCalendarProps | CustomCalendarRangeProps;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// --- Pure Date Helpers ---
function isSameDay(d1: Date | null | undefined, d2: Date | null | undefined): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const t = date.getTime();
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const e = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return t > f && t < e;
}

function isDateBefore(d1: Date, d2: Date): boolean {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return t1 < t2;
}

function isDateAfter(d1: Date, d2: Date): boolean {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return t1 > t2;
}

export function CustomCalendar(props: CalendarProps) {
  const {
    mode = "single",
    minDate,
    maxDate,
    disabledDates,
    highlightDates,
    className = "",
    showPresets = false,
    rentalDurationDays,
  } = props;

  // Derive initial view month from selected date or minDate or today
  const initialDate = useMemo(() => {
    if (mode === "single") {
      return (props as CustomCalendarProps).selected ?? minDate ?? new Date();
    } else {
      return (props as CustomCalendarRangeProps).selected?.from ?? minDate ?? new Date();
    }
  }, [mode, props, minDate]);

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const today = useMemo(() => new Date(), []);

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && isDateBefore(date, minDate)) return true;
    if (maxDate && isDateAfter(date, maxDate)) return true;

    if (disabledDates) {
      if (typeof disabledDates === "function") {
        return disabledDates(date);
      }
      return disabledDates.some((d) => isSameDay(d, date));
    }
    return false;
  };

  // Check if a date is highlighted (auspicious / special)
  const isDateHighlighted = (date: Date): boolean => {
    return highlightDates?.some((d) => isSameDay(d, date)) ?? false;
  };

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days grid computation
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentYear, currentMonth]);

  // Handle day click
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (mode === "single") {
      (props as CustomCalendarProps).onSelect?.(date);
    } else {
      const rangeProps = props as CustomCalendarRangeProps;
      const currentRange = rangeProps.selected ?? { from: null, to: null };

      if (rentalDurationDays && rentalDurationDays > 1) {
        // Automatically compute end date if fixed rental duration (e.g. 3-day wedding rental)
        const toDate = new Date(date);
        toDate.setDate(toDate.getDate() + (rentalDurationDays - 1));
        rangeProps.onSelect?.({ from: date, to: toDate });
      } else if (!currentRange.from || (currentRange.from && currentRange.to)) {
        // Start new range
        rangeProps.onSelect?.({ from: date, to: null });
      } else if (currentRange.from && !currentRange.to) {
        if (isDateBefore(date, currentRange.from)) {
          rangeProps.onSelect?.({ from: date, to: currentRange.from });
        } else {
          rangeProps.onSelect?.({ from: currentRange.from, to: date });
        }
      }
    }
  };

  // Quick preset shortcuts
  const handlePreset = (daysOffset: number, duration = 3) => {
    const targetStart = new Date();
    targetStart.setDate(targetStart.getDate() + daysOffset);

    if (mode === "single") {
      (props as CustomCalendarProps).onSelect?.(targetStart);
    } else {
      const targetEnd = new Date(targetStart);
      targetEnd.setDate(targetEnd.getDate() + (duration - 1));
      (props as CustomCalendarRangeProps).onSelect?.({ from: targetStart, to: targetEnd });
    }

    setCurrentMonth(targetStart.getMonth());
    setCurrentYear(targetStart.getFullYear());
  };

  return (
    <div
      className={`select-none rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all sm:p-5 ${className}`}
    >
      {/* Header Navigator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
            className="px-2.5 py-1 text-sm font-bold text-stone-900 rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-1"
          >
            <span>{MONTH_NAMES[currentMonth]}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "years" ? "days" : "years")}
            className="px-2 py-1 text-sm font-bold text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            {currentYear}
          </button>
        </div>

        {viewMode === "days" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Month Fast-Selector View */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-2 py-2">
          {MONTH_NAMES.map((name, idx) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setCurrentMonth(idx);
                setViewMode("days");
              }}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                currentMonth === idx
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-50 text-stone-700 hover:bg-stone-100"
              }`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Year Fast-Selector View */}
      {viewMode === "years" && (
        <div className="grid grid-cols-3 gap-2 py-2 max-h-56 overflow-y-auto pr-1">
          {Array.from({ length: 12 }, (_, i) => currentYear - 4 + i).map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setCurrentYear(yr);
                setViewMode("days");
              }}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                currentYear === yr
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-50 text-stone-700 hover:bg-stone-100"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      )}

      {/* Day-of-Week and Days Grid */}
      {viewMode === "days" && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {WEEKDAY_NAMES.map((wd) => (
              <div
                key={wd}
                className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1">
            {daysInMonth.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-9 w-9 sm:h-10 sm:w-10" />;
              }

              const disabled = isDateDisabled(date);
              const highlighted = isDateHighlighted(date);
              const isToday = isSameDay(date, today);

              // Selection logic
              let isSelected = false;
              let isRangeStart = false;
              let isRangeEnd = false;
              let isInRange = false;

              if (mode === "single") {
                const singleSelected = (props as CustomCalendarProps).selected;
                isSelected = isSameDay(date, singleSelected);
              } else {
                const range = (props as CustomCalendarRangeProps).selected;
                isRangeStart = isSameDay(date, range?.from);
                isRangeEnd = isSameDay(date, range?.to);
                isSelected = isRangeStart || isRangeEnd;

                if (range?.from && range?.to) {
                  isInRange = isDateInRange(date, range.from, range.to);
                } else if (range?.from && hoveredDate && isDateAfter(hoveredDate, range.from)) {
                  isInRange = isDateInRange(date, range.from, hoveredDate);
                }
              }

              return (
                <div
                  key={date.toISOString()}
                  onMouseEnter={() => !disabled && setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`relative flex items-center justify-center p-0.5 ${
                    isInRange ? "bg-rose-50/70" : ""
                  } ${isRangeStart && !isRangeEnd ? "rounded-l-xl bg-rose-50/70" : ""} ${
                    isRangeEnd && !isRangeStart ? "rounded-r-xl bg-rose-50/70" : ""
                  }`}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDateClick(date)}
                    className={`h-9 w-9 sm:h-10 sm:w-10 text-xs sm:text-sm font-semibold rounded-xl flex flex-col items-center justify-center transition-all relative ${
                      disabled
                        ? "text-stone-300 line-through decoration-stone-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-rose-900 text-white shadow-md shadow-rose-950/20 scale-105 z-10"
                        : isInRange
                        ? "text-rose-900 font-bold hover:bg-rose-100/70"
                        : "text-stone-800 hover:bg-stone-100 active:scale-95"
                    } ${isToday && !isSelected ? "border border-stone-300 font-bold" : ""}`}
                  >
                    <span>{date.getDate()}</span>

                    {/* Auspicious / Muhurat Wedding Badge */}
                    {highlighted && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Buttons for Wedding Bookings */}
      {showPresets && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => handlePreset(3, rentalDurationDays || 3)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium whitespace-nowrap transition-colors"
          >
            This Weekend
          </button>
          <button
            type="button"
            onClick={() => handlePreset(10, rentalDurationDays || 3)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium whitespace-nowrap transition-colors"
          >
            Next Weekend
          </button>
          <button
            type="button"
            onClick={() => handlePreset(30, rentalDurationDays || 3)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-medium whitespace-nowrap transition-colors"
          >
            In 1 Month
          </button>
        </div>
      )}
    </div>
  );
}
