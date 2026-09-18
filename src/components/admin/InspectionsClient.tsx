"use client";

import { useState, useMemo } from "react";
import { ClipboardCheck } from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import type { InspectionType, ConditionStatus } from "@/types/database";

type InspectionRow = {
  id: string;
  inspection_type: InspectionType;
  condition_status: ConditionStatus;
  notes: string | null;
  deduction_amount: number;
  created_at: string;
  bookings: { id: string; booking_number: string } | null;
  inspector: { id: string; full_name: string | null } | null;
};

type TypeFilter = "all" | InspectionType;
type ConditionFilter = "all" | ConditionStatus;

function formatCurrency(n: number) {
  return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "—";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface InspectionsClientProps {
  initialInspections: InspectionRow[];
}

export function InspectionsClient({ initialInspections }: InspectionsClientProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      all: initialInspections.length,
      pre_rental: initialInspections.filter((i) => i.inspection_type === "pre_rental").length,
      post_return: initialInspections.filter((i) => i.inspection_type === "post_return").length,
    }),
    [initialInspections]
  );

  const conditionCounts = useMemo(
    () => ({
      all: initialInspections.length,
      good: initialInspections.filter((i) => i.condition_status === "good").length,
      minor_damage: initialInspections.filter((i) => i.condition_status === "minor_damage").length,
      major_damage: initialInspections.filter((i) => i.condition_status === "major_damage").length,
      missing_item: initialInspections.filter((i) => i.condition_status === "missing_item").length,
    }),
    [initialInspections]
  );

  const filtered = useMemo(() => {
    return initialInspections.filter((i) => {
      if (typeFilter !== "all" && i.inspection_type !== typeFilter) return false;
      if (conditionFilter !== "all" && i.condition_status !== conditionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          i.bookings?.booking_number.toLowerCase().includes(q) ||
          i.inspector?.full_name?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialInspections, typeFilter, conditionFilter, search]);

  const typeTabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "pre_rental", label: "Pre-Rental", count: counts.pre_rental },
    { value: "post_return", label: "Post-Return", count: counts.post_return },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={typeTabs}
          active={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search booking #, inspector…"
          className="sm:w-64"
        />
      </div>

      {/* Condition sub-filter */}
      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
        <span className="font-medium">Condition:</span>
        {(["all", "good", "minor_damage", "major_damage", "missing_item"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setConditionFilter(c)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
              conditionFilter === c
                ? "bg-rose-800 dark:bg-rose-700 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {c === "all" ? `All (${conditionCounts.all})` : `${c.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} (${conditionCounts[c]})`}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={ClipboardCheck}
            title="No inspections found"
            description="No inspection reports match the current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Booking</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Condition</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Deduction</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Inspector</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <AdminBadge
                        status={inspection.inspection_type === "pre_rental" ? "info" : "warning"}
                        label={inspection.inspection_type === "pre_rental" ? "Pre-Rental" : "Post-Return"}
                      />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                        {inspection.bookings?.booking_number ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge status={inspection.condition_status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-sm font-semibold ${inspection.deduction_amount > 0 ? "text-rose-700 dark:text-rose-400" : "text-stone-400 dark:text-stone-500"}`}>
                        {formatCurrency(inspection.deduction_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-stone-700 dark:text-stone-300">
                        {inspection.inspector?.full_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-stone-500 dark:text-stone-400 max-w-[180px] truncate block">
                        {inspection.notes ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(inspection.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
          Showing {filtered.length} of {initialInspections.length} inspections
        </p>
      )}
    </div>
  );
}
