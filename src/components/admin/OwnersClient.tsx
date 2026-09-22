"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Calendar,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { suspendOwner, unsuspendOwner } from "@/app/(admin)/admin/owners/actions";

export interface OwnerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  city: string | null;
  state: string | null;
  verification_status: "pending" | "verified" | "rejected";
  is_suspended: boolean;
  created_at: string;
  application?: {
    id: string;
    status: string;
    submitted_at: string | null;
    admin_notes?: string | null;
  } | null;
  outfit_count: number;
  published_outfits_count?: number;
  paused_outfits_count?: number;
  total_bookings_count?: number;
  completed_bookings_count?: number;
  total_earnings?: number;
  outfits_sample?: Array<{
    id: string;
    title: string;
    slug?: string;
    status: string;
    rental_price: number;
  }>;
}

interface OwnersClientProps {
  owners: OwnerRow[];
}

type VerFilter = "all" | "verified" | "suspended" | "pending" | "rejected";

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OwnersClient({ owners: initialOwners }: OwnersClientProps) {
  const [owners, setOwners] = useState<OwnerRow[]>(initialOwners);
  const [filter, setFilter] = useState<VerFilter>("all");
  const [search, setSearch] = useState("");

  // ── Modals State ──────────────────────────────────────────────────────────
  const [selectedOwner, setSelectedOwner] = useState<OwnerRow | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [actionOwner, setActionOwner] = useState<OwnerRow | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "unsuspend" | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isActionPending, setIsActionPending] = useState(false);

  const counts = useMemo(
    () => ({
      all: owners.length,
      verified: owners.filter((o) => o.verification_status === "verified" && !o.is_suspended).length,
      suspended: owners.filter((o) => o.is_suspended).length,
      pending: owners.filter((o) => o.verification_status === "pending").length,
      rejected: owners.filter((o) => o.verification_status === "rejected").length,
    }),
    [owners]
  );

  const filtered = useMemo(() => {
    return owners.filter((o) => {
      if (filter === "suspended") {
        if (!o.is_suspended) return false;
      } else if (filter !== "all") {
        if (o.verification_status !== filter) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.full_name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.state?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [owners, filter, search]);

  const tabs = [
    { value: "all", label: "All Owners", count: counts.all },
    { value: "verified", label: "Verified Active", count: counts.verified },
    { value: "suspended", label: "Suspended", count: counts.suspended },
    { value: "pending", label: "Pending KYC", count: counts.pending },
    { value: "rejected", label: "Rejected", count: counts.rejected },
  ];

  // ── Handler: Execute Suspend / Unsuspend ───────────────────────────────────
  async function handleConfirmAction() {
    if (!actionOwner || !actionType) return;

    setIsActionPending(true);
    try {
      if (actionType === "suspend") {
        const res = await suspendOwner(actionOwner.id, suspensionReason);
        if (!res.success) {
          toast.error(res.error || "Failed to suspend owner.");
        } else {
          toast.success(
            `Owner "${actionOwner.full_name || "Owner"}" has been suspended. ${res.pausedCount ? `${res.pausedCount} published outfits paused.` : ""
            }`
          );

          // Optimistic update
          setOwners((prev) =>
            prev.map((o) =>
              o.id === actionOwner.id
                ? {
                  ...o,
                  is_suspended: true,
                  paused_outfits_count:
                    (o.paused_outfits_count ?? 0) + (o.published_outfits_count ?? 0),
                  published_outfits_count: 0,
                }
                : o
            )
          );

          if (selectedOwner?.id === actionOwner.id) {
            setSelectedOwner((prev) =>
              prev ? { ...prev, is_suspended: true } : null
            );
          }
        }
      } else {
        const res = await unsuspendOwner(actionOwner.id);
        if (!res.success) {
          toast.error(res.error || "Failed to unsuspend owner.");
        } else {
          toast.success(`Owner "${actionOwner.full_name || "Owner"}" account restored.`);

          // Optimistic update
          setOwners((prev) =>
            prev.map((o) =>
              o.id === actionOwner.id ? { ...o, is_suspended: false } : o
            )
          );

          if (selectedOwner?.id === actionOwner.id) {
            setSelectedOwner((prev) =>
              prev ? { ...prev, is_suspended: false } : null
            );
          }
        }
      }
    } catch {
      toast.error("An unexpected error occurred while processing action.");
    } finally {
      setIsActionPending(false);
      setActionOwner(null);
      setActionType(null);
      setSuspensionReason("");
    }
  }

  return (
    <div className="space-y-5">
      {/* ── TOP SEARCH & TABS ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={tabs}
          active={filter}
          onChange={(v) => setFilter(v as VerFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, phone, city…"
          className="sm:w-72"
        />
      </div>

      {/* ── OWNERS TABLE ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title="No owners found"
            description="No wardrobe owners match the current filter or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Boutique Owner
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Account Standing
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                    Wardrobe
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden xl:table-cell">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((owner) => {
                  const initials = (owner.full_name ?? "Owner")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={owner.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors group"
                    >
                      {/* Owner Identity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {owner.avatar_url ? (
                            <Image
                              src={owner.avatar_url}
                              alt={owner.full_name || "Owner"}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                {owner.full_name ?? "—"}
                              </p>
                              {owner.is_suspended && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-1.5 py-0.2 rounded-full">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 dark:text-stone-500 sm:hidden">
                              {owner.email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {owner.email && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                              <Mail size={11} className="text-stone-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{owner.email}</span>
                            </div>
                          )}
                          {owner.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                              <Phone size={11} className="text-stone-400 shrink-0" />
                              <span>{owner.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {owner.city || owner.state ? (
                          <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
                            <MapPin size={11} className="text-stone-400 shrink-0" />
                            <span>{[owner.city, owner.state].filter(Boolean).join(", ")}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>

                      {/* Standing Status (TASK 13.1) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <AdminBadge status={owner.verification_status} />
                          {owner.is_suspended && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-full">
                              <ShieldAlert size={11} /> Suspended
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wardrobe count */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div>
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            {owner.outfit_count} outfits
                          </span>
                          {owner.published_outfits_count !== undefined && (
                            <p className="text-[10px] text-stone-400">
                              {owner.published_outfits_count} live
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Realized Revenue */}
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {formatCurrency(owner.total_earnings ?? 0)}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile Modal (TASK 13.2) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOwner(owner);
                              setProfileModalOpen(true);
                            }}
                            title="View Owner Full Profile & Metrics"
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye size={12} />
                            <span>Profile</span>
                          </button>

                          {/* Suspend / Unsuspend Button (TASK 13.1) */}
                          {owner.is_suspended ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionOwner(owner);
                                setActionType("unsuspend");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                            >
                              <ShieldCheck size={12} />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActionOwner(owner);
                                setActionType("suspend");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <ShieldAlert size={12} />
                              <span>Suspend</span>
                            </button>
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
        <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
          Showing {filtered.length} of {owners.length} registered boutique owners
        </p>
      )}

      {/* ── MODAL 1: OWNER FULL PROFILE MODAL (TASK 13.2) ───────────────────── */}
      {profileModalOpen &&
        selectedOwner &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => setProfileModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3.5">
                  {selectedOwner.avatar_url ? (
                    <Image
                      src={selectedOwner.avatar_url}
                      alt={selectedOwner.full_name || "Owner"}
                      width={52}
                      height={52}
                      className="h-13 w-13 rounded-2xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-700 text-lg font-bold text-white shadow-sm">
                      {(selectedOwner.full_name ?? "Owner")
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-stone-950 dark:text-stone-100">
                        {selectedOwner.full_name || "Boutique Owner"}
                      </h3>
                      {selectedOwner.is_suspended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <ShieldAlert size={12} /> Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      ShaadiRent Partner since {formatDate(selectedOwner.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                    <ShoppingBag size={14} className="text-rose-800 dark:text-rose-400" />
                    <span>Listed Wardrobe</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {selectedOwner.outfit_count}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {selectedOwner.published_outfits_count ?? 0} active ·{" "}
                    {selectedOwner.paused_outfits_count ?? 0} paused
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                    <Calendar size={14} className="text-amber-800 dark:text-amber-400" />
                    <span>Customer Rentals</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {selectedOwner.total_bookings_count ?? 0}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {selectedOwner.completed_bookings_count ?? 0} successfully returned
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                    <Wallet size={14} className="text-emerald-800 dark:text-emerald-400" />
                    <span>Net Realized Income</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatCurrency(selectedOwner.total_earnings ?? 0)}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">After platform commission</p>
                </div>
              </div>

              {/* Contact & Location Details */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                  Contact &amp; Operating Location
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-stone-400">Email Address</p>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      {selectedOwner.email || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-stone-400">Mobile Phone</p>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      {selectedOwner.phone ? `+91 ${selectedOwner.phone}` : "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-stone-400">Operating City &amp; State</p>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      {[selectedOwner.city, selectedOwner.state].filter(Boolean).join(", ") ||
                        "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-stone-400">Identity Verification</p>
                    <div className="mt-0.5">
                      <AdminBadge status={selectedOwner.verification_status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Onboarding KYC Application Card */}
              {selectedOwner.application ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-700" />
                      <span className="font-bold text-amber-950 dark:text-amber-200">
                        Owner Onboarding Application
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white dark:bg-stone-800 text-amber-800 border border-amber-200">
                        {selectedOwner.application.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                      Submitted on {formatDate(selectedOwner.application.submitted_at || selectedOwner.created_at)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/applications`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 dark:text-rose-400 hover:text-rose-950 transition-colors"
                  >
                    <span>View Application Details</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ) : null}

              {/* Outfits Preview */}
              {selectedOwner.outfits_sample && selectedOwner.outfits_sample.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                      Wardrobe Outfits Preview ({selectedOwner.outfit_count})
                    </h4>
                    <Link
                      href={`/browse?ownerId=${selectedOwner.id}&ownerName=${encodeURIComponent(selectedOwner.full_name || "Owner")}`}
                      className="text-[11px] text-rose-800 dark:text-rose-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Search on Browse</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedOwner.outfits_sample.map((outfit) => (
                      <div
                        key={outfit.id}
                        className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between text-xs group hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                      >
                        <div className="truncate mr-2">
                          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {outfit.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${outfit.status === "published"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : outfit.status === "in_review"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                }`}
                            >
                              {outfit.status}
                            </span>
                            {outfit.status === "published" && outfit.slug && (
                              <Link
                                href={`/outfits/${outfit.slug}`}
                                target="_blank"
                                className="text-[10px] text-rose-800 dark:text-rose-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>View</span>
                                <ExternalLink size={9} />
                              </Link>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-rose-900 dark:text-rose-300 shrink-0">
                          {formatCurrency(outfit.rental_price)}/4d
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                {selectedOwner.is_suspended ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActionOwner(selectedOwner);
                      setActionType("unsuspend");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>Restore Owner Account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActionOwner(selectedOwner);
                      setActionType("suspend");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShieldAlert size={14} />
                    <span>Suspend Owner</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 2: SUSPEND / UNSUSPEND CONFIRMATION MODAL (TASK 13.1) ──────── */}
      {actionOwner &&
        actionType &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => !isActionPending && setActionOwner(null)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${actionType === "suspend"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                  {actionType === "suspend" ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <CheckCircle2 size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-stone-950 dark:text-stone-100">
                    {actionType === "suspend" ? "Suspend Boutique Owner?" : "Restore Owner Account?"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {actionOwner.full_name || actionOwner.email}
                  </p>
                </div>
              </div>

              {actionType === "suspend" ? (
                <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
                  <p>
                    Suspending this owner will:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-500 text-[11px]">
                    <li>
                      Automatically <strong>pause all published outfits</strong> from this wardrobe.
                    </li>
                    <li>
                      Prevent customers from making any new bookings with this owner.
                    </li>
                    <li>Mark the owner profile with a suspended account status.</li>
                  </ul>

                  <div>
                    <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      Reason for suspension (optional):
                    </label>
                    <textarea
                      rows={2}
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      placeholder="e.g. Non-fulfillment of bookings, repeated garment damages, or KYC policy violation..."
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Restoring this owner will clear their suspension flag. Their outfits can be resumed from the listings manager.
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => setActionOwner(null)}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={handleConfirmAction}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${actionType === "suspend"
                      ? "bg-rose-700 hover:bg-rose-800"
                      : "bg-emerald-700 hover:bg-emerald-800"
                    }`}
                >
                  {isActionPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : actionType === "suspend" ? (
                    <ShieldAlert size={13} />
                  ) : (
                    <ShieldCheck size={13} />
                  )}
                  <span>
                    {isActionPending
                      ? "Processing..."
                      : actionType === "suspend"
                        ? "Confirm Suspension"
                        : "Confirm Restore"}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
