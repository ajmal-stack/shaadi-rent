"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, ChevronDown, ArrowRight } from "lucide-react";
import { CustomCalendar, type DateRange } from "./CustomCalendar";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((d: Date) => boolean);
  highlightDates?: Date[];
  disabled?: boolean;
  showPresets?: boolean;
  rentalDurationDays?: number;
  className?: string;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function DateRangePicker({
  value = { from: null, to: null },
  onChange,
  placeholder = "Select Rental Dates",
  label,
  error,
  minDate,
  maxDate,
  disabledDates,
  highlightDates,
  disabled = false,
  showPresets = true,
  rentalDurationDays,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (range: DateRange) => {
    onChange?.(range);
    if (range.from && range.to) {
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ from: null, to: null });
  };

  const hasSelection = Boolean(value.from);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[46px] flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-150 focus:outline-none ${
          disabled
            ? "bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed"
            : error
            ? "border border-rose-400 bg-rose-50/30 text-rose-950 ring-2 ring-rose-900/10 shadow-xs"
            : isOpen
            ? "border border-rose-400 bg-white ring-2 ring-rose-900/10 shadow-xs"
            : "border border-stone-200/80 bg-stone-50/80 hover:bg-white hover:border-rose-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon
            size={16}
            className="shrink-0 text-rose-700"
          />
          <div className="flex flex-col text-left truncate">
            {label && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {label}
              </span>
            )}
            {value.from ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-900 truncate">
                <span>{formatDateShort(value.from)}</span>
                <ArrowRight size={12} className="text-stone-400 shrink-0" />
                <span>{value.to ? formatDateShort(value.to) : "Select return date"}</span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-stone-900 truncate leading-tight">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasSelection && !disabled && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-rose-800" : ""}`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 w-full sm:w-[340px] rounded-2xl border border-rose-100 bg-white p-2 shadow-2xl shadow-rose-950/15 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
          <CustomCalendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            highlightDates={highlightDates}
            showPresets={showPresets}
            rentalDurationDays={rentalDurationDays}
            className="border-0 shadow-none p-2"
          />
        </div>
      )}
    </div>
  );
}
