"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { Shirt, MapPin, CheckCircle2, XCircle, AlertCircle, Archive } from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { updateOutfitVerification, archiveOutfit } from "@/app/(admin)/admin/outfits/actions";
import type { OutfitStatus, OutfitVerificationStatus, OutfitCondition } from "@/types/database";

type OutfitRow = {
  id: string;
  title: string;
  rental_price: number;
  status: OutfitStatus;
  verification_status: OutfitVerificationStatus;
  city: string | null;
  state: string | null;
  created_at: string;
  condition: OutfitCondition;
  categories: { id: string; name: string } | null;
  profiles: { id: string; full_name: string | null; email: string | null } | null;
};

type StatusFilter = "all" | OutfitStatus;
type VerFilter = "all" | OutfitVerificationStatus;

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface OutfitsClientProps {
  initialOutfits: OutfitRow[];
}

export function OutfitsClient({ initialOutfits }: OutfitsClientProps) {
  const [outfits, setOutfits] = useState<OutfitRow[]>(initialOutfits);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verFilter, setVerFilter] = useState<VerFilter>("all");
  const [search, setSearch] = useState("");
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusCounts = useMemo(() => ({
    all: outfits.length,
    published: outfits.filter((o) => o.status === "published").length,
    pending_review: outfits.filter((o) => o.status === "pending_review").length,
    draft: outfits.filter((o) => o.status === "draft").length,
    paused: outfits.filter((o) => o.status === "paused").length,
    archived: outfits.filter((o) => o.status === "archived").length,
  }), [outfits]);

  const verCounts = useMemo(() => ({
    all: outfits.length,
    pending: outfits.filter((o) => o.verification_status === "pending").length,
    approved: outfits.filter((o) => o.verification_status === "approved").length,
    rejected: outfits.filter((o) => o.verification_status === "rejected").length,
    changes_requested: outfits.filter((o) => o.verification_status === "changes_requested").length,
  }), [outfits]);

  const filtered = useMemo(() => {
    return outfits.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (verFilter !== "all" && o.verification_status !== verFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.title.toLowerCase().includes(q) ||
          o.categories?.name.toLowerCase().includes(q) ||
          o.profiles?.full_name?.toLowerCase().includes(q) ||
          o.profiles?.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [outfits, statusFilter, verFilter, search]);

  async function handleVerification(id: string, vs: OutfitVerificationStatus) {
    startTransition(async () => {
      const result = await updateOutfitVerification(id, vs);
      if (result.success) {
        setOutfits((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  verification_status: vs,
                  status: vs === "approved" ? "published" : vs === "rejected" ? "paused" : o.status,
                }
              : o
          )
        );
        toast.success(`Outfit ${vs === "approved" ? "approved" : vs === "rejected" ? "rejected" : "updated"}.`);
      } else {
        toast.error(result.error ?? "Failed to update.");
      }
    });
  }

  async function handleArchive(id: string) {
    startTransition(async () => {
      const result = await archiveOutfit(id);
      if (result.success) {
        setOutfits((prev) => prev.map((o) => o.id === id ? { ...o, status: "archived" as OutfitStatus } : o));
        toast.success("Outfit archived.");
      } else {
        toast.error(result.error ?? "Failed to archive.");
      }
      setConfirmArchive(null);
    });
  }

  const statusTabs = [
    { value: "all", label: "All", count: statusCounts.all },
    { value: "published", label: "Published", count: statusCounts.published },
    { value: "pending_review", label: "Pending Review", count: statusCounts.pending_review },
    { value: "draft", label: "Draft", count: statusCounts.draft },
    { value: "paused", label: "Paused", count: statusCounts.paused },
    { value: "archived", label: "Archived", count: statusCounts.archived },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <AdminFilterTabs
            tabs={statusTabs}
            active={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
          <AdminSearch value={search} onChange={setSearch} placeholder="Search outfits, owner…" className="sm:w-64" />
        </div>
        {/* Verification sub-filter */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="font-medium">Verification:</span>
          {(["all", "pending", "approved", "rejected", "changes_requested"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerFilter(v)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                verFilter === v ? "bg-rose-800 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {v === "all" ? "All" : v === "pending" ? `Pending (${verCounts.pending})` : v === "approved" ? `Approved (${verCounts.approved})` : v === "rejected" ? `Rejected (${verCounts.rejected})` : `Changes (${verCounts.changes_requested})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState icon={Shirt} title="No outfits found" description="Adjust your filters or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Outfit</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Verification</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Price</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Listed</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((outfit) => {
                  const isArchiving = confirmArchive === outfit.id;
                  return (
                    <tr key={outfit.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Outfit info */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-stone-900 max-w-[180px] truncate">{outfit.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {outfit.categories && (
                            <span className="text-[11px] text-stone-400">{outfit.categories.name}</span>
                          )}
                          {(outfit.city || outfit.state) && (
                            <span className="text-[11px] text-stone-400 flex items-center gap-0.5">
                              <MapPin size={9} />
                              {[outfit.city, outfit.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Owner */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-stone-700 font-medium">{outfit.profiles?.full_name ?? "—"}</p>
                        <p className="text-[11px] text-stone-400 truncate max-w-[140px]">{outfit.profiles?.email ?? ""}</p>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3"><AdminBadge status={outfit.status} /></td>
                      {/* Verification */}
                      <td className="px-4 py-3"><AdminBadge status={outfit.verification_status} /></td>
                      {/* Price */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-semibold text-stone-800">{formatCurrency(outfit.rental_price)}</span>
                        <span className="text-xs text-stone-400">/day</span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-stone-500">{formatDate(outfit.created_at)}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {outfit.verification_status !== "approved" && outfit.status !== "archived" && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleVerification(outfit.id, "approved")}
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          )}
                          {outfit.verification_status !== "rejected" && outfit.status !== "archived" && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleVerification(outfit.id, "rejected")}
                              className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                          {outfit.status !== "archived" && !isArchiving && (
                            <button
                              type="button"
                              onClick={() => setConfirmArchive(outfit.id)}
                              className="text-[11px] text-stone-400 hover:text-stone-600 hover:bg-stone-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              <Archive size={12} />
                            </button>
                          )}
                          {isArchiving && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-stone-500">Archive?</span>
                              <button type="button" disabled={isPending} onClick={() => handleArchive(outfit.id)} className="text-[11px] font-bold text-rose-700 disabled:opacity-50">Yes</button>
                              <button type="button" onClick={() => setConfirmArchive(null)} className="text-[11px] text-stone-400">No</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          Showing {filtered.length} of {outfits.length} outfits
        </p>
      )}
    </div>
  );
}
