"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { AvailabilityWindow } from "./OutfitAvailability";

export interface DynamicAvailabilityCalendarProps {
  availability?: AvailabilityWindow[] | null;
  selectedDate?: string | null;
  onSelectDate: (dateStr: string) => void;
  className?: string;
  compact?: boolean;
}

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

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DynamicAvailabilityCalendar({
  availability = [],
  selectedDate,
  onSelectDate,
  className = "",
  compact = false,
}: DynamicAvailabilityCalendarProps) {
  // Earliest selectable date is tomorrow
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Determine initial month view: selectedDate or tomorrow
  const initialView = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
  }, [selectedDate, tomorrow]);

  const [currentYear, setCurrentYear] = useState(initialView.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialView.getMonth());
  const [blockedAlertDate, setBlockedAlertDate] = useState<string | null>(null);

  // Sync calendar view if selectedDate changes from an external control
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    }
  }, [selectedDate]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setBlockedAlertDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setBlockedAlertDate(null);
  };

  // Blocked and maintenance windows list
  const blockedList = useMemo(() => {
    return (
      availability?.filter(
        (a) => a.status === "blocked" || a.status === "maintenance"
      ) ?? []
    );
  }, [availability]);

  // Compute status for any date
  // Returns: "past" | "blocked" | "available"
  const getDateStatus = (date: Date): { status: "past" | "blocked" | "available"; reason?: string } => {
    const dTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (dTime < tomorrow.getTime()) {
      return { status: "past" };
    }

    // Check if the date directly falls in a blocked window
    for (const b of blockedList) {
      const bStart = new Date(b.start_date).getTime();
      const bEnd = new Date(b.end_date).getTime();
      if (dTime >= bStart && dTime <= bEnd) {
        return {
          status: "blocked",
          reason: `Reserved (${new Date(b.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(b.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})`,
        };
      }
    }

    // Check 4-day rental window collision (delivery = event - 2 days, return = event + 1 day)
    const deliveryTime = dTime - 2 * 24 * 60 * 60 * 1000;
    const returnTime = dTime + 1 * 24 * 60 * 60 * 1000;

    for (const b of blockedList) {
      const bStart = new Date(b.start_date).getTime();
      const bEnd = new Date(b.end_date).getTime();
      if (deliveryTime <= bEnd && returnTime >= bStart) {
        return {
          status: "blocked",
          reason: `Overlaps existing booking (${new Date(b.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(b.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})`,
        };
      }
    }

    return { status: "available" };
  };

  // Build grid of days in currentMonth
  const daysGrid = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const grid: Array<Date | null> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      grid.push(new Date(currentYear, currentMonth, d));
    }
    return grid;
  }, [currentYear, currentMonth]);

  // Selected date object
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return null;
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return null;
  }, [selectedDate]);

  // Selected 4-day delivery & return schedule strings
  const scheduleDetails = useMemo(() => {
    if (!selectedDateObj) return null;
    const del = new Date(selectedDateObj);
    del.setDate(del.getDate() - 2);
    const ret = new Date(selectedDateObj);
    ret.setDate(ret.getDate() + 1);

    return {
      deliveryStr: del.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      eventStr: selectedDateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      returnStr: ret.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    };
  }, [selectedDateObj]);

  const handleCellClick = (date: Date) => {
    const { status, reason } = getDateStatus(date);
    if (status === "past") return;

    if (status === "blocked") {
      const dateStr = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      setBlockedAlertDate(`${dateStr} is already booked or reserved.`);
      toast.error(`${dateStr} is unavailable. Please select an open green date.`);
      return;
    }

    setBlockedAlertDate(null);
    const iso = toISODateString(date);
    onSelectDate(iso);
  };

  // Disable navigating to past months
  const isPrevMonthDisabled = useMemo(() => {
    const firstOfCurrent = new Date(currentYear, currentMonth, 1).getTime();
    const firstOfToday = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    return firstOfCurrent <= firstOfToday;
  }, [currentYear, currentMonth, today]);

  return (
    <div
      className={`transition-all ${
        compact
          ? "rounded-2xl bg-rose-50/30 border border-rose-100/80 p-3 sm:p-3.5 space-y-2.5"
          : "rounded-3xl bg-white border border-rose-100/90 p-4 sm:p-5 shadow-2xs space-y-3.5"
      } ${className}`}
    >
      {/* ── 1. HEADER: Month Navigator & Legend ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-xl bg-rose-100/80 text-rose-800 ${
              compact ? "h-7 w-7 rounded-lg" : "h-8 w-8"
            }`}
          >
            <Calendar size={compact ? 14 : 16} />
          </div>
          <div>
            <h3
              className={`font-display font-bold text-stone-950 ${
                compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
              }`}
            >
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <p className="text-[9px] text-stone-500">Live Wedding Availability</p>
          </div>
        </div>

        {/* Prev / Next Month Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevMonthDisabled}
            aria-label="Previous Month"
            className={`flex items-center justify-center border border-stone-200 text-stone-700 hover:bg-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer ${
              compact ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl"
            }`}
          >
            <ChevronLeft size={compact ? 14 : 16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next Month"
            className={`flex items-center justify-center border border-stone-200 text-stone-700 hover:bg-white active:scale-95 transition-all cursor-pointer ${
              compact ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl"
            }`}
          >
            <ChevronRight size={compact ? 14 : 16} />
          </button>
        </div>
      </div>

      {/* ── 2. VISUAL COLOR LEGEND ─────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between bg-white/90 border border-rose-100/80 font-semibold text-stone-600 ${
          compact ? "rounded-xl px-2 py-1.5 text-[9px]" : "rounded-2xl px-3 py-2 text-[10px]"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-900 ring-2 ring-rose-300 shrink-0" />
          <span>Your Event</span>
        </div>
      </div>

      {/* Blocked Date Alert Notice */}
      {blockedAlertDate && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-rose-900 animate-fadeIn">
          <AlertCircle size={13} className="text-rose-600 shrink-0" />
          <span>{blockedAlertDate}</span>
        </div>
      )}

      {/* ── 3. WEEKDAYS & DAYS GRID ────────────────────────────────────────── */}
      <div>
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAY_NAMES.map((wd) => (
            <div
              key={wd}
              className={`font-bold uppercase tracking-wider text-stone-400 ${
                compact ? "text-[9px] py-0.5" : "text-[10px] py-1"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1">
          {daysGrid.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className={compact ? "h-8 w-full" : "h-9 w-full"} />;
            }

            const { status } = getDateStatus(date);
            const isSelected = selectedDateObj ? isSameDay(date, selectedDateObj) : false;
            const isToday = isSameDay(date, today);

            // Styling states
            let cellStyle = "";
            let dotStyle = "";

            if (isSelected) {
              cellStyle =
                "bg-gradient-to-br from-rose-800 to-rose-950 text-white font-extrabold shadow-md ring-2 ring-rose-400/80 scale-105 z-10";
              dotStyle = "bg-white";
            } else if (status === "past") {
              cellStyle =
                "text-stone-300 bg-stone-50/40 cursor-not-allowed";
              dotStyle = "";
            } else if (status === "blocked") {
              // 🔴 RED BOOKED DATE
              cellStyle =
                "bg-rose-50/90 text-rose-800 border border-rose-200/80 line-through font-medium opacity-80 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-not-allowed";
              dotStyle = "bg-rose-600";
            } else {
              // 🟢 GREEN AVAILABLE DATE
              cellStyle =
                "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-bold border border-emerald-200/90 hover:scale-105 shadow-2xs active:scale-95 transition-all cursor-pointer";
              dotStyle = "bg-emerald-600";
            }

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleCellClick(date)}
                disabled={status === "past"}
                className={`relative w-full rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                  compact ? "h-8 sm:h-9" : "h-10"
                } ${cellStyle} ${
                  isToday && !isSelected ? "ring-1 ring-amber-400" : ""
                }`}
                title={
                  status === "blocked"
                    ? "Booked / Reserved"
                    : status === "available"
                    ? "Available to Rent"
                    : "Past Date"
                }
              >
                <span className="leading-none">{date.getDate()}</span>

                {/* Status Dot */}
                {dotStyle && (
                  <span
                    className={`h-1 w-1 rounded-full mt-0.5 ${dotStyle}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. SELECTED 4-DAY SCHEDULE BANNER ──────────────────────────────── */}
      {scheduleDetails ? (
        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/90 p-2.5 space-y-1.5 text-xs text-emerald-950 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-700" />
              <span>4-Day Rental Itinerary Selected</span>
            </span>
            <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[9px] font-extrabold text-emerald-900">
              Verified Open
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-emerald-200/60 text-center">
            <div className="rounded-lg bg-white/80 p-1.5 border border-emerald-200/50">
              <span className="text-[8px] uppercase font-bold text-stone-500 block flex items-center justify-center gap-0.5">
                <Truck size={10} className="text-rose-700" />
                Delivery
              </span>
              <span className="font-bold text-stone-900 text-[10px] block mt-0.5">
                {scheduleDetails.deliveryStr}
              </span>
            </div>

            <div className="rounded-lg bg-emerald-100/90 p-1.5 border border-emerald-300/80">
              <span className="text-[8px] uppercase font-extrabold text-emerald-900 block flex items-center justify-center gap-0.5">
                <Sparkles size={10} className="text-amber-600" />
                Wedding Day
              </span>
              <span className="font-extrabold text-emerald-950 text-[10px] block mt-0.5">
                {scheduleDetails.eventStr}
              </span>
            </div>

            <div className="rounded-lg bg-white/80 p-1.5 border border-emerald-200/50">
              <span className="text-[8px] uppercase font-bold text-stone-500 block flex items-center justify-center gap-0.5">
                <RotateCcw size={10} className="text-indigo-700" />
                Return
              </span>
              <span className="font-bold text-stone-900 text-[10px] block mt-0.5">
                {scheduleDetails.returnStr}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-stone-50/80 p-2 text-[10px] sm:text-[11px] text-stone-500 border border-stone-100">
          <Info size={12} className="text-stone-400 shrink-0" />
          <span>Tap any <strong className="text-emerald-700">green date</strong> to reserve your 4-day wedding rental.</span>
        </div>
      )}
    </div>
  );
}
