import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOutfitImageUrl } from "@/lib/utils/image";
import { ListingsClient } from "./ListingsClient";
import {
  PlusCircle,
  LayoutList,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Listings — ShaadiRent Owner",
  description: "Manage all your outfit listings — edit, pause, resume, or archive them.",
};

export const dynamic = "force-dynamic";

export default async function OwnerListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all outfits for this owner — every status, newest first
  const { data: outfits } = await supabase
    .from("outfits")
    .select(
      `
      id, title, slug, status, verification_status,
      rental_price, security_deposit, condition,
      brand, color, description,
      city, state, created_at, updated_at,
      category:categories!inner(name, gender_type),
      images:outfit_images(storage_path, sort_order, image_type)
      `
    )
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const allOutfits = outfits ?? [];

  // ── Summary counts ──────────────────────────────────────────────────────────
  const counts = {
    total:    allOutfits.length,
    published: allOutfits.filter((o) => o.status === "published").length,
    paused:    allOutfits.filter((o) => o.status === "paused").length,
    pending:   allOutfits.filter((o) => o.status === "pending_review").length,
    draft:     allOutfits.filter((o) => o.status === "draft").length,
    archived:  allOutfits.filter((o) => o.status === "archived").length,
  };

  function getPrimaryImage(
    images: Array<{ storage_path: string; sort_order: number; image_type: string }>
  ): string {
    if (!images || images.length === 0) return getOutfitImageUrl(null);
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    return getOutfitImageUrl(sorted[0].storage_path);
  }

  // Serialize outfits for the client component
  const serializedOutfits = allOutfits.map((o) => ({
    id:                  o.id,
    title:               o.title,
    slug:                o.slug,
    status:              o.status,
    verification_status: o.verification_status,
    rental_price:        Number(o.rental_price),
    security_deposit:    Number(o.security_deposit),
    condition:           o.condition,
    brand:               o.brand ?? "",
    color:               o.color ?? "",
    description:         o.description ?? "",
    city:                o.city ?? "",
    state:               o.state ?? "",
    created_at:          o.created_at,
    imageUrl:            getPrimaryImage(
      (o.images ?? []) as Array<{ storage_path: string; sort_order: number; image_type: string }>
    ),
    category: (o.category as { name: string; gender_type: string } | null)?.name ?? "",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-amber-50/10 to-white pb-24">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="border-b border-rose-100/70 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 to-rose-900 shadow-sm">
              <LayoutList size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-rose-950 leading-none">
                My Listings
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {counts.total} outfit{counts.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link
            href="/list-your-outfit/details"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 hover:shadow transition-all active:scale-[0.98]"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">Add New Listing</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 space-y-8">

        {/* ── Summary pills ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All",       count: counts.total,     color: "bg-stone-100 text-stone-700 border-stone-200" },
            { label: "Published", count: counts.published, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
            { label: "Paused",    count: counts.paused,    color: "bg-blue-50 text-blue-800 border-blue-200" },
            { label: "In Review", count: counts.pending,   color: "bg-amber-50 text-amber-800 border-amber-200" },
            { label: "Draft",     count: counts.draft,     color: "bg-stone-50 text-stone-600 border-stone-200" },
            { label: "Archived",  count: counts.archived,  color: "bg-red-50 text-red-700 border-red-200" },
          ].map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s.color}`}
            >
              {s.label}
              <span className="font-bold">{s.count}</span>
            </span>
          ))}
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {counts.total === 0 && (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
              <Sparkles size={28} className="text-rose-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-rose-950">
              No listings yet
            </h2>
            <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              List your first wedding outfit and start earning. It takes less than 15 minutes.
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

        {/* ── Listings grid (client for interactivity) ─────────────────────── */}
        {counts.total > 0 && (
          <ListingsClient outfits={serializedOutfits} />
        )}
      </div>
    </div>
  );
}
