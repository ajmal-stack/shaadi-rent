import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getOutfitImageUrl } from "@/lib/utils/image";
import {
  PlusCircle,
  Package,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Edit3,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  XCircle,
  BarChart3,
  CalendarCheck,
  Wallet,
} from "lucide-react";
import { MobileOwnerDashboard } from "@/components/owner/MobileOwnerDashboard";

export const metadata: Metadata = {
  title: "Owner Dashboard — ShaadiRent",
  description:
    "Manage your listed outfits, track bookings, and monitor your earnings.",
};

// ── Status pill config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    color: "text-stone-600",
    bg: "bg-stone-100",
    border: "border-stone-200",
    icon: Edit3,
  },
  pending_review: {
    label: "In Review",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  published: {
    label: "Published",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  paused: {
    label: "Paused",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Eye,
  },
  archived: {
    label: "Archived",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
  },
};

export default async function OwnerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", user!.id)
    .single();

  // Load owner's outfits with primary image and basic stats
  const { data: outfits } = await supabase
    .from("outfits")
    .select(
      `
      id, title, slug, status, verification_status,
      rental_price, security_deposit, condition,
      city, state, created_at, updated_at,
      category:categories!inner(name, gender_type),
      images:outfit_images(storage_path, sort_order, image_type)
      `
    )
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const allOutfits = outfits ?? [];

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalOutfits = allOutfits.length;
  const publishedCount = allOutfits.filter((o) => o.status === "published").length;
  const pendingCount = allOutfits.filter((o) => o.status === "pending_review").length;
  const draftCount = allOutfits.filter((o) => o.status === "draft").length;

  // Potential monthly earnings (rough estimate: published * rental_price * 1.5 rentals/month)
  const potentialEarnings = allOutfits
    .filter((o) => o.status === "published")
    .reduce((sum, o) => sum + Number(o.rental_price) * 1.5, 0);

  // Helper: get primary image for an outfit
  function getPrimaryImage(
    images: Array<{ storage_path: string; sort_order: number; image_type: string }>
  ): string {
    if (!images || images.length === 0) return getOutfitImageUrl(null);
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    return getOutfitImageUrl(sorted[0].storage_path);
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Owner";

  return (
    <>
      {/* ── MOBILE VIEW (< md) ── Superapp Boutique Hub ── */}
      <div className="block md:hidden">
        <MobileOwnerDashboard
          firstName={firstName}
          profile={profile}
          outfits={allOutfits as any}
          totalOutfits={totalOutfits}
          publishedCount={publishedCount}
          pendingCount={pendingCount}
          draftCount={draftCount}
          potentialEarnings={potentialEarnings}
        />
      </div>

      {/* ── DESKTOP & TABLET VIEW (≥ md) ── Wide Grid Layout ── */}
      <div className="hidden md:block min-h-screen bg-gradient-to-b from-amber-50/30 via-rose-50/20 to-white pb-24">
        {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-rose-100/70 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 to-rose-900 shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-rose-950 leading-none">
                Owner Dashboard
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Welcome back, {firstName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/earnings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Wallet size={14} className="text-emerald-700" />
              <span className="hidden sm:inline">Earnings</span>
            </Link>
            <Link
              href="/requests"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <CalendarCheck size={14} className="text-rose-700" />
              <span className="hidden sm:inline">Bookings</span>
            </Link>
            <Link
              href="/list-your-outfit/details"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 hover:shadow transition-all active:scale-[0.98]"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">List New Outfit</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 space-y-8">
        {/* ── Stats cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Listings",
              value: totalOutfits,
              icon: Package,
              color: "text-stone-700",
              bg: "bg-stone-100",
              border: "border-stone-200",
              sub: totalOutfits === 1 ? "outfit" : "outfits",
            },
            {
              label: "Live Now",
              value: publishedCount,
              icon: CheckCircle2,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              border: "border-emerald-200",
              sub: "published",
            },
            {
              label: "In Review",
              value: pendingCount,
              icon: Clock,
              color: "text-amber-700",
              bg: "bg-amber-50",
              border: "border-amber-200",
              sub: "awaiting admin",
            },
            {
              label: "Est. Monthly",
              value:
                potentialEarnings > 0
                  ? `₹${Math.round(potentialEarnings).toLocaleString("en-IN")}`
                  : "—",
              icon: TrendingUp,
              color: "text-rose-700",
              bg: "bg-rose-50",
              border: "border-rose-200",
              sub: "potential earnings",
            },
          ].map(({ label, value, icon: Icon, color, bg, border, sub }) => (
            <div
              key={label}
              className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-500">{label}</p>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${border} ${bg}`}
                >
                  <Icon size={15} className={color} />
                </div>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-stone-900">
                  {value}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {totalOutfits === 0 && (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
              <Sparkles size={28} className="text-rose-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-rose-950">
              No listings yet
            </h2>
            <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              List your first wedding outfit and start earning. It takes less than
              15 minutes.
            </p>
            <Link
              href="/list-your-outfit/details"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 transition-all"
            >
              <PlusCircle size={16} />
              List Your First Outfit
            </Link>
          </div>
        )}

        {/* ── Drafts banner ─────────────────────────────────────────────── */}
        {draftCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertCircle size={18} className="shrink-0 text-amber-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {draftCount} draft{draftCount !== 1 ? "s" : ""} not submitted
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Complete and submit them for review to start earning.
              </p>
            </div>
            <Link
              href="/list-your-outfit/details"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Continue
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* ── Outfit listings ───────────────────────────────────────────── */}
        {totalOutfits > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-rose-950">
                Your Outfits
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <BarChart3 size={13} />
                {totalOutfits} listing{totalOutfits !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allOutfits.map((outfit) => {
                const status =
                  STATUS_CONFIG[outfit.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = status.icon;
                const imageUrl = getPrimaryImage(
                  (outfit.images ?? []) as Array<{
                    storage_path: string;
                    sort_order: number;
                    image_type: string;
                  }>
                );
                const category = outfit.category as
                  | { name: string; gender_type: string }
                  | null;
                const location = [outfit.city, outfit.state]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={outfit.id}
                    className="group rounded-2xl border border-stone-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={outfit.title}
                        fill
                        className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />

                      {/* Status badge */}
                      <div
                        className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${status.bg} ${status.border} ${status.color}`}
                      >
                        <StatusIcon size={11} />
                        {status.label}
                      </div>

                      {/* Verification badge */}
                      {outfit.verification_status === "approved" && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          <Star size={9} className="fill-white" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Category */}
                      {category && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {category.name}
                        </p>
                      )}

                      {/* Title */}
                      <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">
                        {outfit.title}
                      </h3>

                      {/* Price row */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold text-rose-950">
                          ₹{Number(outfit.rental_price).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          / rental
                        </span>
                      </div>

                      {/* Location + condition */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>{location || "Location not set"}</span>
                        <span className="capitalize">
                          {outfit.condition?.replace("_", " ")}
                        </span>
                      </div>

                      {/* Pending review note */}
                      {outfit.status === "pending_review" && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                          Under review — usually within 24 hours
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-auto pt-3 border-t border-stone-100 flex items-center gap-2">
                        {outfit.status === "draft" ? (
                          <Link
                            href="/list-your-outfit/details"
                            className="flex-1 text-center rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors"
                          >
                            Continue Editing
                          </Link>
                        ) : outfit.status === "published" ? (
                          <>
                            <Link
                              href={`/outfits/${outfit.slug}`}
                              className="flex-1 text-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 hover:border-rose-300 hover:text-rose-800 transition-colors"
                            >
                              View Listing
                            </Link>
                            <Link
                              href="/listings"
                              className="flex-1 text-center rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors"
                            >
                              Manage
                            </Link>
                          </>
                        ) : outfit.status === "paused" ? (
                          <Link
                            href="/listings"
                            className="flex-1 text-center rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors"
                          >
                            Manage
                          </Link>
                        ) : (
                          <span className="flex-1 text-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-500">
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add new outfit card */}
              <Link
                href="/list-your-outfit/details"
                className="group rounded-2xl border-2 border-dashed border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/40 transition-all duration-200 flex flex-col items-center justify-center gap-3 p-8 min-h-[280px]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 group-hover:bg-rose-100 transition-colors">
                  <PlusCircle size={22} className="text-rose-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-rose-800">
                    List Another Outfit
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Expand your collection
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── Tips section ──────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-900 to-stone-900 p-6 sm:p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-amber-100">
                Tips to get more rentals
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Add 6–10 high-quality photos from different angles",
                  "Set a competitive price — check similar listings on Browse",
                  "Fill in measurements accurately — they build renter confidence",
                  "Mark your availability calendar to show you're active",
                  "Write a detailed description mentioning fabric, brand, and any alterations",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-rose-100/80">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-emerald-400"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
