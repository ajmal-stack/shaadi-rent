import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getTrendingOutfits } from "@/lib/data/trendingOutfits";
import { OutfitCard } from "@/components/browse/OutfitCard";

export async function TrendingOutfits() {
  const { outfits, wishlistedIds } = await getTrendingOutfits();
  const wishlistedSet = new Set(wishlistedIds);

  return (
    <section className="py-16 sm:py-24 bg-stone-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-800">
              <Sparkles size={13} className="text-amber-600" />
              Smart Luxury
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950">
              Trending for Wedding Season
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl">
              Real designer wear reserved by brides & grooms this month. Experience couture elegance at a tenth of retail price.
            </p>
          </div>

          <Link
            href="/browse"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-rose-900 shadow-xs hover:bg-rose-50 transition-colors"
          >
            <span>Browse 500+ Outfits</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── 3:4 Aspect Ratio Product Cards with Active Wishlist ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              initialWishlisted={wishlistedSet.has(outfit.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
