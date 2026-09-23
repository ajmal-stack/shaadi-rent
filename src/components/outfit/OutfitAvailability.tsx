"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { DynamicAvailabilityCalendar } from "./DynamicAvailabilityCalendar";

export interface AvailabilityWindow {
  start_date: string;
  end_date: string;
  status: "available" | "blocked" | "maintenance";
}

interface OutfitAvailabilityProps {
  availability?: AvailabilityWindow[] | null;
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string) => void;
}

export function OutfitAvailability({
  availability = [],
  selectedDate,
  onSelectDate,
}: OutfitAvailabilityProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(selectedDate ?? null);

  const handleDateSelect = (d: string) => {
    setInternalSelectedDate(d);
    onSelectDate?.(d);
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
            Interactive calendar &bull; 🟢 Green = Open to rent &bull; 🔴 Red = Booked / Reserved
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Dynamic Visual Month Calendar */}
        <DynamicAvailabilityCalendar
          availability={availability}
          selectedDate={selectedDate ?? internalSelectedDate}
          onSelectDate={handleDateSelect}
          className="border-0 p-0 shadow-none"
        />
      </div>
    </div>
  );
}
