"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  PlusCircle,
  Edit3,
  Pause,
  Play,
  Archive,
  RotateCcw,
  Eye,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  MapPin,
  Loader2,
  Filter,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { ListingItem } from "@/app/(owner)/listings/ListingsClient";

interface MobileListingsViewProps {
  items: ListingItem[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  archiveId: string | null;
  setArchiveId: (id: string | null) => void;
  actionLoading: { id: string; action: "pause" | "unpause" | "unarchive" } | null;
  handlePause: (id: string) => Promise<void>;
  handleUnpause: (id: string) => Promise<void>;
  handleUnarchive: (id: string) => Promise<void>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  published: {
    label: "Live",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  paused: {
    label: "Paused",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Eye,
  },
  pending_review: {
    label: "In Review",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  draft: {
    label: "Draft",
    color: "text-stone-600",
    bg: "bg-stone-100",
    border: "border-stone-200",
    icon: Edit3,
  },
  archived: {
    label: "Archived",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
};

export function MobileListingsView({
  items,
  editingId,
  setEditingId,
  archiveId,
  setArchiveId,
  actionLoading,
  handlePause,
  handleUnpause,
  handleUnarchive,
}: MobileListingsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "published" | "paused" | "pending_review" | "draft" | "archived"
  >("all");

  // Status counts
  const counts = useMemo(() => {
    return {
      all: items.length,
      published: items.filter((o) => o.status === "published").length,
      paused: items.filter((o) => o.status === "paused").length,
      pending_review: items.filter((o) => o.status === "pending_review").length,
      draft: items.filter((o) => o.status === "draft").length,
      archived: items.filter((o) => o.status === "archived").length,
    };
  }, [items]);

  // Combined filtering: tab + search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q);
        const matchesColor = item.color?.toLowerCase().includes(q);
        const matchesCity = item.city?.toLowerCase().includes(q);
        return matchesTitle || matchesCategory || matchesBrand || matchesColor || matchesCity;
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-amber-50/20 to-[#fdfefe] pb-28 text-gray-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-3 space-y-3.5">
        {/* ── 1. MOBILE HEADER & ADD BUTTON ─────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-snug">
              My Wardrobe Listings
            </h1>
            <p className="text-[11px] text-gray-500">
              {counts.all} total • {counts.published} live for rent
            </p>
          </div>

          <Link
            href="/list-your-outfit/details"
            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
          >
            <PlusCircle size={14} />
            <span>Add Outfit</span>
          </Link>
        </div>

        {/* ── 2. INSTANT SEARCH BAR ─────────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, designer, color, category…"
            className="w-full rounded-2xl bg-white border border-gray-200/90 pl-10 pr-9 py-2.5 text-xs text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── 3. INTERACTIVE STATUS SEGMENT TABS (Scrollable) ──────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all" as const, label: "All", count: counts.all },
            { id: "published" as const, label: "Live", count: counts.published },
            { id: "paused" as const, label: "Paused", count: counts.paused },
            { id: "pending_review" as const, label: "Review", count: counts.pending_review },
            { id: "draft" as const, label: "Drafts", count: counts.draft },
            { id: "archived" as const, label: "Archived", count: counts.archived },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? "bg-rose-900 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 4. LISTINGS COUNT / SUMMARY BAR ──────────────────────────────── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-0.5">
          <span>
            Showing <strong>{filteredItems.length}</strong> of {counts.all} outfits
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="font-bold text-rose-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── 5. OUTFIT CARDS (MOBILE OPTIMIZED) ───────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center space-y-3 border border-gray-100 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <Package size={26} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">
              No outfits match your filters
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {searchQuery
                ? `No outfits found matching "${searchQuery}". Try clearing search or selecting a different status.`
                : `You currently have no outfits marked as ${activeTab}.`}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <Link
                href="/list-your-outfit/details"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-800 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                <PlusCircle size={14} />
                <span>List New</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((outfit) => {
              const status = STATUS_CONFIG[outfit.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = status.icon;
              const location = [outfit.city, outfit.state].filter(Boolean).join(", ");
              const isArchived = outfit.status === "archived";
              const isLoading = actionLoading?.id === outfit.id;

              return (
                <div
                  key={outfit.id}
                  className={`rounded-3xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border transition-all ${
                    isArchived ? "opacity-60 border-stone-200" : "border-gray-100/90"
                  }`}
                >
                  {/* Top Section: Image + Details */}
                  <div className="flex gap-3.5 items-start">
                    {/* Square Thumbnail */}
                    <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                      <Image
                        src={outfit.imageUrl}
                        alt={outfit.title}
                        fill
                        className="object-cover object-top"
                        sizes="96px"
                      />

                      {/* Status pill on image */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-xs border backdrop-blur-xs ${status.bg} ${status.border} ${status.color}`}
                        >
                          <StatusIcon size={9} />
                          {status.label}
                        </span>
                      </div>

                      {/* Verified Badge */}
                      {outfit.verification_status === "approved" && (
                        <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                          <Star size={8} className="fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Outfit Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {outfit.category && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 truncate">
                          {outfit.category}
                        </p>
                      )}

                      <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                        {outfit.title}
                      </h3>

                      {/* Price & Deposit */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="font-display font-bold text-rose-950 text-sm">
                          ₹{outfit.rental_price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-400">/ rental</span>
                        {outfit.security_deposit > 0 && (
                          <span className="text-[10px] text-gray-500 font-mono">
                            • Dep: ₹{outfit.security_deposit.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Location & Condition */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                        <span className="truncate">
                          {location || "Location not set"}
                        </span>
                        <span className="capitalize font-medium shrink-0 ml-1">
                          {outfit.condition?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Notes for special cases */}
                  {outfit.status === "pending_review" && (
                    <p className="mt-2.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1.5">
                      ⏳ Under admin review — usually approved within 24 hours.
                    </p>
                  )}
                  {outfit.status === "paused" && (
                    <p className="mt-2.5 text-[11px] text-blue-800 bg-blue-50/80 border border-blue-200/60 rounded-xl px-2.5 py-1.5">
                      ⏸️ Paused — hidden from renters. Resume anytime.
                    </p>
                  )}

                  {/* Action Buttons Row */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                    {isArchived ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUnarchive(outfit.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 py-2 text-xs font-semibold active:scale-98 transition-all disabled:opacity-50"
                      >
                        {isLoading && actionLoading?.action === "unarchive" ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Restoring…</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={13} />
                            <span>Restore Listing</span>
                          </>
                        )}
                      </button>
                    ) : outfit.status === "draft" ? (
                      <Link
                        href="/list-your-outfit/details"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white py-2 text-xs font-bold shadow-xs active:scale-98 transition-all text-center"
                      >
                        <Edit3 size={13} />
                        <span>Continue Editing Draft</span>
                      </Link>
                    ) : (
                      <>
                        {/* 1. Edit Details */}
                        <button
                          type="button"
                          onClick={() => setEditingId(outfit.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2 text-xs font-semibold text-gray-700 active:scale-98 transition-all"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        {/* 2. Pause / Resume Toggle */}
                        {outfit.status === "published" ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handlePause(outfit.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2 text-xs font-semibold text-blue-700 active:scale-98 transition-all disabled:opacity-50"
                          >
                            {isLoading && actionLoading?.action === "pause" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Pause size={13} />
                            )}
                            <span>Pause</span>
                          </button>
                        ) : outfit.status === "paused" ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleUnpause(outfit.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2 text-xs font-bold shadow-xs active:scale-98 transition-all disabled:opacity-50"
                          >
                            {isLoading && actionLoading?.action === "unpause" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Play size={13} className="fill-white" />
                            )}
                            <span>Resume</span>
                          </button>
                        ) : null}

                        {/* 3. View public listing */}
                        {outfit.status === "published" && (
                          <Link
                            href={`/outfits/${outfit.slug}`}
                            target="_blank"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            title="View public page"
                          >
                            <Eye size={14} />
                          </Link>
                        )}

                        {/* 4. Archive */}
                        <button
                          type="button"
                          onClick={() => setArchiveId(outfit.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                          title="Archive listing"
                        >
                          <Archive size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
