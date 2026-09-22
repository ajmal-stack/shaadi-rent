"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export type DateRangeOption = "7d" | "30d" | "90d" | "all";

interface DateRangeSelectorProps {
  currentRange?: string;
}

const RANGES: { id: DateRangeOption; label: string; tooltip: string }[] = [
  { id: "7d", label: "7D", tooltip: "Last 7 Days" },
  { id: "30d", label: "30D", tooltip: "Last 30 Days" },
  { id: "90d", label: "90D", tooltip: "Last 90 Days" },
  { id: "all", label: "All", tooltip: "All Time History" },
];

export function DateRangeSelector({ currentRange = "30d" }: DateRangeSelectorProps) {
  const searchParams = useSearchParams();

  function createRangeHref(rangeId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (rangeId === "30d") {
      // Default can either be omitted or explicit; let's keep ?range=30d or omit
      params.set("range", "30d");
    } else {
      params.set("range", rangeId);
    }
    return `/admin?${params.toString()}`;
  }

  const activeRange = RANGES.some((r) => r.id === currentRange) ? currentRange : "30d";

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm shadow-inner">
      <div className="px-2 text-stone-400 dark:text-stone-500 hidden sm:flex items-center gap-1 text-[11px] font-medium">
        <Calendar size={13} />
        <span>Range:</span>
      </div>

      <div className="flex items-center gap-1">
        {RANGES.map((r) => {
          const isActive = activeRange === r.id;
          return (
            <Link
              key={r.id}
              href={createRangeHref(r.id)}
              title={r.tooltip}
              scroll={false}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-rose-800 text-white shadow-sm shadow-rose-900/20"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
