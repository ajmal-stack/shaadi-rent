"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  Sparkles,
  TrendingUp,
  Package,
  CalendarCheck,
  Wallet,
  PlusCircle,
  ChevronRight,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  AlertCircle,
  Eye,
  Edit3,
  HelpCircle,
  Lightbulb,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getOutfitImageUrl } from "@/lib/utils/image";

export interface DashboardOutfit {
  id: string;
  title: string;
  slug: string;
  status: string;
  verification_status: string;
  rental_price: number | string;
  security_deposit: number | string;
  condition: string;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string; gender_type: string } | null;
  images: Array<{ storage_path: string; sort_order: number; image_type: string }>;
}

interface MobileOwnerDashboardProps {
  firstName: string;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
  outfits: DashboardOutfit[];
  totalOutfits: number;
  publishedCount: number;
  pendingCount: number;
  draftCount: number;
  potentialEarnings: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  published: {
    label: "Live",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  pending_review: {
    label: "In Review",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  draft: {
    label: "Draft",
    color: "text-stone-600",
    bg: "bg-stone-100",
    border: "border-stone-200",
  },
  paused: {
    label: "Paused",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  archived: {
    label: "Archived",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

function getPrimaryImage(
  images: Array<{ storage_path: string; sort_order: number; image_type: string }>
): string {
  if (!images || images.length === 0) return getOutfitImageUrl(null);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return getOutfitImageUrl(sorted[0].storage_path);
}

export function MobileOwnerDashboard({
  firstName,
  profile,
  outfits,
  totalOutfits,
  publishedCount,
  pendingCount,
  draftCount,
  potentialEarnings,
}: MobileOwnerDashboardProps) {
  const [filter, setFilter] = useState<"all" | "published" | "pending_review" | "draft">("all");
  const [tipsOpen, setTipsOpen] = useState(false);

  const filteredOutfits = outfits.filter((outfit) => {
    if (filter === "all") return true;
    return outfit.status === filter;
  });

  const initials = (profile?.full_name || "Owner")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-rose-50/20 to-[#fcfdfd] pb-28 text-gray-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ── 1. BOUTIQUE OWNER HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Owner Avatar with Royal Crown Badge */}
            <div className="relative shrink-0">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || "Owner"}
                  width={52}
                  height={52}
                  className="h-13 w-13 rounded-full object-cover ring-2 ring-amber-400/90 shadow-xs"
                />
              ) : (
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-rose-700 text-lg font-bold text-white shadow-xs">
                  {initials}
                </div>
              )}
              {/* Crown Badge */}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-amber-950 ring-2 ring-white shadow-xs">
                <Crown size={11} className="fill-amber-950" />
              </div>
            </div>

            {/* Greeting & Boutique Name */}
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                <Crown size={10} className="text-amber-700" />
                <span>Boutique Partner</span>
              </div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-snug mt-0.5">
                Namaste, {firstName}
              </h1>
              <p className="text-[11px] text-gray-500">
                {publishedCount} {publishedCount === 1 ? "outfit" : "outfits"} live in wardrobe
              </p>
            </div>
          </div>

          {/* Quick Add Button */}
          <Link
            href="/list-your-outfit/details"
            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-950 px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
          >
            <PlusCircle size={14} />
            <span>List</span>
          </Link>
        </div>

        {/* ── 2. HERO REVENUE & EARNINGS METRIC CARD ──────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white p-5 shadow-md">
          {/* Subtle Ambient Mandala Glow */}
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-radial from-amber-400/25 via-rose-500/10 to-transparent blur-2xl pointer-events-none"
          />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-200/90 tracking-wide uppercase">
                Estimated Monthly Revenue
              </span>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-xs">
                <TrendingUp size={11} />
                <span>Active Wardrobe</span>
              </div>
            </div>

            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-white">
                {potentialEarnings > 0
                  ? `₹${Math.round(potentialEarnings).toLocaleString("en-IN")}`
                  : "₹0"}
              </p>
              <p className="text-[11px] text-rose-200/70 mt-0.5">
                Projected from your live designer listings
              </p>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-xs">
                <p className="text-base font-bold text-white">{publishedCount}</p>
                <p className="text-[10px] text-rose-200/70">Live Outfits</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-xs">
                <p className="text-base font-bold text-amber-300">{pendingCount}</p>
                <p className="text-[10px] text-rose-200/70">In Review</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-xs">
                <p className="text-base font-bold text-rose-200">{draftCount}</p>
                <p className="text-[10px] text-rose-200/70">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. DRAFTS ALERT BANNER (If any) ─────────────────────────────────── */}
        {draftCount > 0 && (
          <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs leading-snug">
                  {draftCount} unfinished {draftCount === 1 ? "outfit" : "outfits"}
                </h4>
                <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                  Complete and submit for review to start renting.
                </p>
              </div>
            </div>
            <Link
              href="/list-your-outfit/details"
              className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
            >
              Resume
            </Link>
          </div>
        )}

        {/* ── 4. QUICK ACTION (2x2 Grid — Superapp Style) ────────────────────── */}
        <div className="space-y-2.5 pt-1">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: My Listings */}
            <Link
              href="/listings"
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-rose-700 text-white shadow-xs">
                <Package size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-800 tracking-tight">
                  My Listings
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {totalOutfits} in closet
                </p>
              </div>
            </Link>

            {/* Tile 2: Booking Requests */}
            <Link
              href="/requests"
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-xs">
                <CalendarCheck size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-800 tracking-tight">
                  Requests
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Bookings &amp; trials
                </p>
              </div>
            </Link>

            {/* Tile 3: Earnings & Payouts */}
            <Link
              href="/earnings"
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs">
                <Wallet size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-800 tracking-tight">
                  Earnings
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Payouts &amp; escrow
                </p>
              </div>
            </Link>

            {/* Tile 4: Add New Outfit */}
            <Link
              href="/list-your-outfit/details"
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
                <PlusCircle size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-800 tracking-tight">
                  List Outfit
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Earn ₹15k–50k
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── 5. WARDROBE COLLECTION (Mobile Outfit Cards) ────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm tracking-tight">
              Your Wardrobe Collection
            </h2>
            <Link
              href="/listings"
              className="text-xs font-bold text-rose-800 hover:text-rose-950 inline-flex items-center gap-0.5"
            >
              <span>Manage All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all" as const, label: `All (${totalOutfits})` },
              { id: "published" as const, label: `Live (${publishedCount})` },
              { id: "pending_review" as const, label: `Review (${pendingCount})` },
              { id: "draft" as const, label: `Drafts (${draftCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                  filter === tab.id
                    ? "bg-rose-900 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filteredOutfits.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center space-y-3 border border-gray-100 shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <Package size={26} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">
                No outfits found in this category
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {filter === "all"
                  ? "You haven’t listed any outfits yet. Start earning by adding your bridal or groom couture."
                  : `You currently have 0 outfits marked as ${filter.replace("_", " ")}.`}
              </p>
              <Link
                href="/list-your-outfit/details"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-800 hover:bg-rose-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs"
              >
                <PlusCircle size={14} />
                <span>List an Outfit</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOutfits.map((outfit) => {
                const status = STATUS_CONFIG[outfit.status] ?? STATUS_CONFIG.draft;
                const imageUrl = getPrimaryImage(outfit.images);
                const category = outfit.category;
                const location = [outfit.city, outfit.state].filter(Boolean).join(", ");

                return (
                  <div
                    key={outfit.id}
                    className="rounded-3xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 flex gap-3.5 items-center hover:shadow-md transition-all"
                  >
                    {/* Outfit Thumbnail */}
                    <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={outfit.title}
                        fill
                        className="object-cover object-top"
                        sizes="80px"
                      />
                      {outfit.verification_status === "approved" && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                          <Star size={8} className="fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Outfit Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 truncate">
                            {category.name}
                          </span>
                        )}
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border shrink-0 ${status.bg} ${status.border} ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-xs truncate">
                        {outfit.title}
                      </h3>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display font-bold text-rose-950 text-sm">
                          ₹{Number(outfit.rental_price).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-400">/ rental</span>
                      </div>

                      {location && (
                        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                          <MapPin size={10} className="shrink-0 text-gray-400" />
                          <span>{location}</span>
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 pl-1">
                      {outfit.status === "draft" ? (
                        <Link
                          href="/list-your-outfit/details"
                          className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors inline-block"
                        >
                          Edit
                        </Link>
                      ) : outfit.status === "published" ? (
                        <Link
                          href={`/outfits/${outfit.slug}`}
                          className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors inline-block"
                        >
                          View
                        </Link>
                      ) : (
                        <Link
                          href="/listings"
                          className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors inline-block"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 6. OWNER EARNINGS & GROWTH TIPS ─────────────────────────────────── */}
        <div className="rounded-3xl bg-white p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 space-y-3">
          <button
            type="button"
            onClick={() => setTipsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Lightbulb size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xs">
                  How to get 3x more bookings
                </h3>
                <p className="text-[10px] text-gray-400">
                  Tips from top ShaadiRent boutique owners
                </p>
              </div>
            </div>
            {tipsOpen ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {tipsOpen && (
            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-600 animate-in fade-in duration-200">
              {[
                "Add 6–10 high-resolution photos in natural daylight or wedding events.",
                "Fill in bust, waist, and length measurements accurately for brides.",
                "Keep rental price competitive (approx 10–15% of original retail purchase price).",
                "Respond to renter trial requests within 2 hours to boost your boutique rating.",
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-[11px] leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
