"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { AlertTriangle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { resolveDispute, markDisputeUnderReview } from "@/app/(admin)/admin/disputes/actions";
import type { DisputeStatus } from "@/types/database";

type DisputeRow = {
  id: string;
  reason: string;
  description: string | null;
  amount: number | null;
  status: DisputeStatus;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  bookings: { id: string; booking_number: string } | null;
  profiles: { id: string; full_name: string | null; email: string | null } | null;
};

type ToastState = { type: "success" | "error"; message: string } | null;

function AdminToast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl border pointer-events-none ${
      toast.type === "success" ? "bg-stone-900 border-stone-700 text-white" : "bg-rose-900 border-rose-700 text-white"
    }`}>
      {toast.type === "success" ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> : <AlertCircle size={15} className="text-rose-300 shrink-0" />}
      {toast.message}
    </div>
  );
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type StatusFilter = "all" | DisputeStatus;

interface DisputesClientProps {
  initialDisputes: DisputeRow[];
}

export function DisputesClient({ initialDisputes }: DisputesClientProps) {
  const [disputes, setDisputes] = useState<DisputeRow[]>(initialDisputes);
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState<{ id: string; action: "resolved" | "rejected" } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const counts = useMemo(() => ({
    all: disputes.length,
    open: disputes.filter((d) => d.status === "open").length,
    under_review: disputes.filter((d) => d.status === "under_review").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
    rejected: disputes.filter((d) => d.status === "rejected").length,
  }), [disputes]);

  const filtered = useMemo(() => {
    return disputes.filter((d) => {
      if (filter !== "all" && d.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.reason.toLowerCase().includes(q) ||
          d.bookings?.booking_number.toLowerCase().includes(q) ||
          d.profiles?.full_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [disputes, filter, search]);

  async function handleMarkUnderReview(id: string) {
    startTransition(async () => {
      const result = await markDisputeUnderReview(id);
      if (result.success) {
        setDisputes((prev) => prev.map((d) => d.id === id ? { ...d, status: "under_review" as DisputeStatus } : d));
        showToast("success", "Dispute marked as under review.");
      } else {
        showToast("error", result.error ?? "Failed.");
      }
    });
  }

  async function handleResolve() {
    if (!resolving) return;
    startTransition(async () => {
      const result = await resolveDispute(resolving.id, resolving.action, resolutionNotes);
      if (result.success) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === resolving.id
              ? { ...d, status: resolving.action as DisputeStatus, resolution_notes: resolutionNotes }
              : d
          )
        );
        showToast("success", `Dispute ${resolving.action}.`);
        setResolving(null);
        setResolutionNotes("");
      } else {
        showToast("error", result.error ?? "Failed.");
      }
    });
  }

  const tabs = [
    { value: "open", label: "Open", count: counts.open },
    { value: "under_review", label: "Under Review", count: counts.under_review },
    { value: "resolved", label: "Resolved", count: counts.resolved },
    { value: "rejected", label: "Rejected", count: counts.rejected },
    { value: "all", label: "All", count: counts.all },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs tabs={tabs} active={filter} onChange={(v) => setFilter(v as StatusFilter)} />
        <AdminSearch value={search} onChange={setSearch} placeholder="Search reason, booking, user…" className="sm:w-72" />
      </div>

      {/* Resolution panel */}
      {resolving && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm ${resolving.action === "resolved" ? "text-emerald-800" : "text-rose-800"}`}>
              {resolving.action === "resolved" ? "✅ Resolve Dispute" : "❌ Reject Dispute"}
            </h3>
            <button type="button" onClick={() => { setResolving(null); setResolutionNotes(""); }} className="text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          </div>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder={resolving.action === "resolved" ? "Describe the resolution and outcome…" : "Reason for rejection…"}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleResolve}
              className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                resolving.action === "resolved" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"
              }`}
            >
              {isPending ? "Submitting…" : `Confirm ${resolving.action === "resolved" ? "Resolution" : "Rejection"}`}
            </button>
            <button type="button" onClick={() => { setResolving(null); setResolutionNotes(""); }} className="px-4 py-2 text-stone-600 text-sm hover:bg-stone-100 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState icon={AlertTriangle} title="No disputes found" description="No disputes match the current filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Dispute</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Raised By</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Booking</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden xl:table-cell">Filed</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-stone-900">{dispute.reason}</p>
                      {dispute.description && (
                        <p className="text-xs text-stone-400 mt-0.5 max-w-[200px] truncate">{dispute.description}</p>
                      )}
                      {dispute.resolution_notes && (
                        <p className="text-[11px] text-emerald-600 mt-0.5 max-w-[200px] truncate">↳ {dispute.resolution_notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-stone-700">{dispute.profiles?.full_name ?? "—"}</p>
                      <p className="text-xs text-stone-400 truncate max-w-[140px]">{dispute.profiles?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {dispute.bookings?.booking_number ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {dispute.amount != null ? (
                        <span className="text-sm font-semibold text-stone-900">{formatCurrency(dispute.amount)}</span>
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><AdminBadge status={dispute.status} /></td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-stone-500">{formatDate(dispute.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {dispute.status === "open" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleMarkUnderReview(dispute.id)}
                            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Review
                          </button>
                        )}
                        {(dispute.status === "open" || dispute.status === "under_review") && (
                          <>
                            <button
                              type="button"
                              onClick={() => setResolving({ id: dispute.id, action: "resolved" })}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => setResolving({ id: dispute.id, action: "rejected" })}
                              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(dispute.status === "resolved" || dispute.status === "rejected") && (
                          <span className="text-[11px] text-stone-400">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 text-right">Showing {filtered.length} of {disputes.length} disputes</p>
      )}

      <AdminToast toast={toast} />
    </div>
  );
}
