"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  label,
  icon,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
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

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      onChange(options[nextIndex].value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      onChange(options[prevIndex].value);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className={`relative inline-block w-full text-left ${
        isOpen ? "z-50" : "z-10"
      } ${className}`}
      ref={selectRef}
      onKeyDown={handleKeyDown}
    >
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[46px] flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-150 focus:outline-none ${
          isOpen
            ? "border border-rose-400 bg-white ring-2 ring-rose-900/10 shadow-xs"
            : "border border-stone-200/80 bg-stone-50/80 hover:bg-white hover:border-rose-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          <div className="flex flex-col text-left truncate">
            {label && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {label}
              </span>
            )}
            <span className="truncate text-xs sm:text-sm font-semibold text-stone-900">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-rose-800" : ""
          }`}
        />
      </button>

      {/* ── Floating Popover Menu ── */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-rose-100 bg-white p-2 shadow-2xl shadow-rose-950/15 ring-1 ring-black/5 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 max-h-[380px] overflow-y-auto sleek-scrollbar"
        >
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full min-h-[40px] flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "bg-rose-50/90 font-bold text-rose-950 border border-rose-200/80 shadow-2xs"
                      : "text-stone-700 hover:bg-stone-50 hover:text-stone-950 border border-transparent font-medium"
                  }`}
                >
                  <div className="flex flex-col pr-2 truncate">
                    <span className="leading-tight truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-[10px] text-stone-400 mt-0.5 truncate font-normal">
                        {option.description}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-900 text-white shadow-2xs">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
