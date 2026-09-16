"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { CustomCalendar } from "./CustomCalendar";

export interface DatePickerProps {
  value?: string | Date | null;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  label?: string; // Inner card label matching CustomSelect (e.g. "WEDDING DATE")
  outerLabel?: string; // Optional external label above the input
  icon?: React.ReactNode;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((d: Date) => boolean);
  highlightDates?: Date[];
  disabled?: boolean;
  showPresets?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseToDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const parts = val.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select Date",
  label,
  outerLabel,
  icon,
  error,
  minDate,
  maxDate,
  disabledDates,
  highlightDates,
  disabled = false,
  showPresets = false,
  className = "",
  name,
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseToDate(value);

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

  const handleSelect = (d: Date | null) => {
    if (d) {
      onChange?.(toISODateString(d));
    } else {
      onChange?.("");
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${
        isOpen ? "z-50" : "z-10"
      } ${className}`}
    >
      {outerLabel && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          {outerLabel}
        </label>
      )}

      {/* Hidden input for HTML form submissions */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={selectedDate ? toISODateString(selectedDate) : ""}
        />
      )}

      {/* Trigger Button — 1:1 Matching CustomSelect Design */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
          {icon ? (
            <span className="shrink-0">{icon}</span>
          ) : (
            <CalendarIcon size={16} className="shrink-0 text-rose-700" />
          )}

          <div className="flex flex-col text-left truncate">
            {label && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 leading-tight">
                {label}
              </span>
            )}
            <span
              className={`truncate text-xs sm:text-sm font-semibold text-stone-900 leading-tight ${
                !label ? "py-0.5" : ""
              }`}
            >
              {selectedDate ? formatDateDisplay(selectedDate) : placeholder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedDate && !disabled && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Clear date"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`shrink-0 text-stone-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-rose-800" : ""
            }`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 w-full sm:w-[320px] rounded-2xl border border-rose-100 bg-white p-2 shadow-2xl shadow-rose-950/15 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
          <CustomCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            highlightDates={highlightDates}
            showPresets={showPresets}
            className="border-0 shadow-none p-2"
          />
        </div>
      )}
    </div>
  );
}
