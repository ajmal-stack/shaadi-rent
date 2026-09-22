"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardCheck,
  Plus,
  X,
  Eye,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import {
  createInspection,
  updateInspectionAssignee,
  completeInspectionAndBooking,
} from "@/app/(admin)/admin/inspections/actions";
import type { InspectionType, ConditionStatus } from "@/types/database";

export interface AdminUserOption {
  id: string;
  full_name: string;
  email: string;
}

export interface EligibleBookingOption {
  id: string;
  booking_number: string;
  status: string;
  outfit_title: string;
  renter_name: string;
  security_deposit: number;
}

export type InspectionRow = {
  id: string;
  inspection_type: InspectionType;
  condition_status: ConditionStatus;
  notes: string | null;
  deduction_amount: number;
  created_at: string;
  created_by?: string | null;
  assigned_to?: string | null;
  assigned_inspector?: { id: string; full_name: string | null } | null;
  bookings: {
    id: string;
    booking_number: string;
    status?: string;
    outfit_title?: string;
    security_deposit?: number;
  } | null;
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

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface InspectionsClientProps {
  initialInspections: InspectionRow[];
  adminUsers?: AdminUserOption[];
  eligibleBookings?: EligibleBookingOption[];
}

export function InspectionsClient({
  initialInspections,
  adminUsers = [],
  eligibleBookings = [],
}: InspectionsClientProps) {
  const [inspections, setInspections] = useState<InspectionRow[]>(initialInspections);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [search, setSearch] = useState("");

  // ── Modal States ──────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRow | null>(null);

  // ── Create Inspection Form State (TASK 12.1) ──────────────────────────────
  const [bookingId, setBookingId] = useState("");
  const [inspectionType, setInspectionType] = useState<InspectionType>("post_return");
  const [conditionStatus, setConditionStatus] = useState<ConditionStatus>("good");
  const [deductionAmount, setDeductionAmount] = useState<number | "">(0);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Inline Assigning Transition (TASK 12.2) ───────────────────────────────
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: inspections.length,
      pre_rental: inspections.filter((i) => i.inspection_type === "pre_rental").length,
      post_return: inspections.filter((i) => i.inspection_type === "post_return").length,
    }),
    [inspections]
  );

  const conditionCounts = useMemo(
    () => ({
      all: inspections.length,
      good: inspections.filter((i) => i.condition_status === "good").length,
      minor_damage: inspections.filter((i) => i.condition_status === "minor_damage").length,
      major_damage: inspections.filter((i) => i.condition_status === "major_damage").length,
      missing_item: inspections.filter((i) => i.condition_status === "missing_item").length,
    }),
    [inspections]
  );

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      if (typeFilter !== "all" && i.inspection_type !== typeFilter) return false;
      if (conditionFilter !== "all" && i.condition_status !== conditionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          i.bookings?.booking_number.toLowerCase().includes(q) ||
          i.bookings?.outfit_title?.toLowerCase().includes(q) ||
          i.inspector?.full_name?.toLowerCase().includes(q) ||
          i.assigned_inspector?.full_name?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inspections, typeFilter, conditionFilter, search]);

  const typeTabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "pre_rental", label: "Pre-Rental", count: counts.pre_rental },
    { value: "post_return", label: "Post-Return", count: counts.post_return },
  ];

  // ── Handler: Submit New Inspection Report (TASK 12.1) ──────────────────────
  async function handleCreateInspection(e: React.FormEvent) {
    e.preventDefault();

    if (!bookingId) {
      toast.error("Please select a booking to inspect.");
      return;
    }

    setIsSubmitting(true);
    try {
      const chosenBooking = eligibleBookings.find((b) => b.id === bookingId);
      const chosenAssignee = adminUsers.find((u) => u.id === assignedTo);

      const numericDeduction = deductionAmount === "" ? 0 : Number(deductionAmount);

      const res = await createInspection({
        booking_id: bookingId,
        inspection_type: inspectionType,
        condition_status: conditionStatus,
        deduction_amount: numericDeduction,
        assigned_to: assignedTo || null,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create inspection report.");
      } else {
        toast.success("Garment inspection report logged successfully!");

        // Optimistic addition
        const newRow: InspectionRow = {
          id: res.id || `temp-${Date.now()}`,
          inspection_type: inspectionType,
          condition_status: conditionStatus,
          notes: notes.trim() || null,
          deduction_amount: numericDeduction,
          created_at: new Date().toISOString(),
          assigned_to: assignedTo || null,
          assigned_inspector: chosenAssignee
            ? { id: chosenAssignee.id, full_name: chosenAssignee.full_name }
            : null,
          bookings: chosenBooking
            ? {
                id: chosenBooking.id,
                booking_number: chosenBooking.booking_number,
                status: chosenBooking.status,
                outfit_title: chosenBooking.outfit_title,
                security_deposit: chosenBooking.security_deposit,
              }
            : null,
          inspector: { id: "current", full_name: "You (Admin)" },
        };

        setInspections((prev) => [newRow, ...prev]);

        // Reset form & close
        setCreateModalOpen(false);
        setBookingId("");
        setInspectionType("post_return");
        setConditionStatus("good");
        setDeductionAmount(0);
        setAssignedTo("");
        setNotes("");
      }
    } catch {
      toast.error("An unexpected error occurred while saving the report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Handler: Update Assigned Inspector (TASK 12.2) ────────────────────────
  async function handleAssignInspector(inspectionId: string, newUserId: string) {
    const targetUser = adminUsers.find((u) => u.id === newUserId);
    setAssigningId(inspectionId);

    try {
      const res = await updateInspectionAssignee(
        inspectionId,
        newUserId === "unassigned" ? null : newUserId
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update assignee.");
      } else {
        toast.success(
          newUserId === "unassigned"
            ? "Inspection marked as unassigned."
            : `Assigned to ${targetUser?.full_name || "inspector"}.`
        );

        setInspections((prev) =>
          prev.map((i) =>
            i.id === inspectionId
              ? {
                  ...i,
                  assigned_to: newUserId === "unassigned" ? null : newUserId,
                  assigned_inspector:
                    newUserId === "unassigned" || !targetUser
                      ? null
                      : { id: targetUser.id, full_name: targetUser.full_name },
                }
              : i
          )
        );
      }
    } catch {
      toast.error("Failed to reassign inspection report.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── TOP TOOLBAR & CREATE BUTTON ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={typeTabs}
          active={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
        />

        <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="Search booking #, outfit, inspector…"
            className="w-full sm:w-64"
          />

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Inspection</span>
          </button>
        </div>
      </div>

      {/* ── CONDITION FILTER PILLS ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
        <span className="font-medium">Condition:</span>
        {(["all", "good", "minor_damage", "major_damage", "missing_item"] as const).map(
          (c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConditionFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                conditionFilter === c
                  ? "bg-rose-900 text-white shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {c === "all"
                ? `All (${conditionCounts.all})`
                : `${c
                    .split("_")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")} (${conditionCounts[c]})`}
            </button>
          )
        )}
      </div>

      {/* ── INSPECTIONS DATA TABLE ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={ClipboardCheck}
            title="No inspections found"
            description="No inspection reports match the selected filters or search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Booking &amp; Outfit
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Condition
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Deduction
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Assigned Inspector
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((inspection) => (
                  <tr
                    key={inspection.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors group"
                  >
                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <AdminBadge
                        status={
                          inspection.inspection_type === "pre_rental"
                            ? "info"
                            : "warning"
                        }
                        label={
                          inspection.inspection_type === "pre_rental"
                            ? "Pre-Rental"
                            : "Post-Return"
                        }
                      />
                    </td>

                    {/* Booking & Outfit */}
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                          {inspection.bookings?.booking_number ?? "—"}
                        </span>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-[200px] truncate">
                          {inspection.bookings?.outfit_title ?? "Designer Bridal Outfit"}
                        </p>
                      </div>
                    </td>

                    {/* Condition Status */}
                    <td className="px-4 py-3.5">
                      <AdminBadge status={inspection.condition_status} />
                    </td>

                    {/* Deduction Amount */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-bold ${
                          inspection.deduction_amount > 0
                            ? "text-rose-700 dark:text-rose-400 font-mono"
                            : "text-stone-400 dark:text-stone-500"
                        }`}
                      >
                        {formatCurrency(inspection.deduction_amount)}
                      </span>
                    </td>

                    {/* Assigned Inspector (TASK 12.2) */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {assigningId === inspection.id ? (
                          <Loader2 size={13} className="animate-spin text-stone-400" />
                        ) : null}

                        <select
                          value={inspection.assigned_to || "unassigned"}
                          disabled={assigningId === inspection.id}
                          onChange={(e) =>
                            handleAssignInspector(inspection.id, e.target.value)
                          }
                          aria-label="Assign inspector"
                          className="text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1 text-stone-800 dark:text-stone-200 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer max-w-[150px] truncate"
                        >
                          <option value="unassigned">Unassigned</option>
                          {adminUsers.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Notes Preview */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-stone-500 dark:text-stone-400 max-w-[200px] truncate block">
                        {inspection.notes || "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(inspection.created_at)}
                      </span>
                    </td>

                    {/* View Details CTA */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInspection(inspection);
                          setDetailModalOpen(true);
                        }}
                        title="View Full Inspection Report"
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
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
          Showing {filtered.length} of {inspections.length} inspection reports
        </p>
      )}

      {/* ── MODAL 1: CREATE INSPECTION REPORT (TASK 12.1) ────────────────────── */}
      {createModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => !isSubmitting && setCreateModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-2xl border border-rose-100 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-900">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-stone-950 dark:text-stone-100">
                      Create Inspection Report
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Log quality checks, damage findings, and deposit penalties.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInspection} className="space-y-4">
                {/* 1. Select Booking */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Select Booking to Inspect *
                  </label>
                  <select
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:border-rose-600 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">-- Choose a rental booking --</option>
                    {eligibleBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_number} — {b.outfit_title} ({b.renter_name}, Status:{" "}
                        {b.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Inspection Type */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Inspection Stage
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInspectionType("pre_rental")}
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        inspectionType === "pre_rental"
                          ? "border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-bold"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <p className="text-xs font-bold">Pre-Rental Dispatch</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Before handing to courier
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectionType("post_return")}
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        inspectionType === "post_return"
                          ? "border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-bold"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <p className="text-xs font-bold">Post-Return Check</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        After renter doorstep return
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Condition Status */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Garment Condition *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: "good", label: "Good", color: "text-emerald-700" },
                        { id: "minor_damage", label: "Minor", color: "text-amber-700" },
                        { id: "major_damage", label: "Major", color: "text-rose-700" },
                        { id: "missing_item", label: "Missing", color: "text-purple-700" },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setConditionStatus(c.id);
                          if (c.id === "good") setDeductionAmount(0);
                        }}
                        className={`rounded-xl border py-2.5 px-3 text-center text-xs font-bold transition-colors cursor-pointer ${
                          conditionStatus === c.id
                            ? "border-rose-900 bg-rose-900 text-white shadow-xs"
                            : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Assigned Inspector (TASK 12.2) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Assign Inspector / Staff
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:border-rose-600 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">-- Leave Unassigned / Self-inspect --</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Deduction Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Security Deposit Deduction (₹)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      ₹0 if garment returned intact
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={deductionAmount}
                    onChange={(e) =>
                      setDeductionAmount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:border-rose-600 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-stone-400">Presets:</span>
                    {[0, 500, 1000, 2500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDeductionAmount(preset)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                          deductionAmount === preset
                            ? "bg-rose-900 text-white border-rose-900"
                            : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Inspection Notes */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Inspection Findings &amp; Damage Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe condition details, stain locations, zipper issues, dry cleaning status, or missing accessories (dupatta, brooch)..."
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:border-rose-600 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* Submit actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !bookingId}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-900 hover:bg-rose-950 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>{isSubmitting ? "Saving Report..." : "Log Inspection"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 2: VIEW FULL INSPECTION REPORT DETAILS ───────────────────── */}
      {detailModalOpen &&
        selectedInspection &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => setDetailModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-rose-900 dark:text-rose-400">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-stone-950 dark:text-stone-100">
                      Inspection Details
                    </h3>
                    <p className="font-mono text-xs text-stone-500">
                      Report #{selectedInspection.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Garment & Booking Summary */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700">
                    {selectedInspection.bookings?.booking_number || "—"}
                  </span>
                  <AdminBadge
                    status={
                      selectedInspection.inspection_type === "pre_rental"
                        ? "info"
                        : "warning"
                    }
                    label={
                      selectedInspection.inspection_type === "pre_rental"
                        ? "Pre-Rental"
                        : "Post-Return"
                    }
                  />
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
                    {selectedInspection.bookings?.outfit_title || "Designer Garment"}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Logged on {formatDateTime(selectedInspection.created_at)}
                  </p>
                </div>
              </div>

              {/* Status and Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-white dark:bg-stone-900">
                  <p className="text-[11px] text-stone-500">Condition Result</p>
                  <div className="mt-1.5">
                    <AdminBadge status={selectedInspection.condition_status} />
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-white dark:bg-stone-900">
                  <p className="text-[11px] text-stone-500">Deposit Deduction</p>
                  <p
                    className={`mt-1 font-display text-base font-bold ${
                      selectedInspection.deduction_amount > 0
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {formatCurrency(selectedInspection.deduction_amount)}
                  </p>
                </div>
              </div>

              {/* Personnel */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5">
                  <p className="text-[11px] text-stone-500">Created By</p>
                  <p className="font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {selectedInspection.inspector?.full_name || "Admin Staff"}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5">
                  <p className="text-[11px] text-stone-500">Assigned Inspector</p>
                  <p className="font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {selectedInspection.assigned_inspector?.full_name || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Inspection Notes */}
              <div>
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Inspector Findings &amp; Notes
                </p>
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed min-h-[70px]">
                  {selectedInspection.notes || (
                    <span className="italic text-stone-400">
                      No specific damage notes recorded. Garment inspected and cleared.
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
                {selectedInspection.inspection_type === "post_return" &&
                selectedInspection.bookings?.id &&
                selectedInspection.bookings?.status !== "completed" ? (
                  <button
                    type="button"
                    disabled={completingBookingId === selectedInspection.bookings.id}
                    onClick={async () => {
                      if (!selectedInspection.bookings?.id) return;
                      try {
                        setCompletingBookingId(selectedInspection.bookings.id);
                        const res = await completeInspectionAndBooking(
                          selectedInspection.bookings.id,
                          `Inspection approved by admin (Condition: ${selectedInspection.condition_status}, Deduction: ₹${selectedInspection.deduction_amount})`
                        );
                        if (res.success) {
                          toast.success("Inspection approved! Booking marked as Completed 🎉");
                          setInspections((prev) =>
                            prev.map((i) =>
                              i.bookings?.id === selectedInspection.bookings?.id
                                ? {
                                    ...i,
                                    bookings: i.bookings ? { ...i.bookings, status: "completed" } : null,
                                  }
                                : i
                            )
                          );
                          setDetailModalOpen(false);
                        } else {
                          toast.error(res.error || "Failed to complete booking.");
                        }
                      } catch {
                        toast.error("An unexpected error occurred while completing booking.");
                      } finally {
                        setCompletingBookingId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {completingBookingId === selectedInspection.bookings.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Approve &amp; Mark Booking Completed</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
