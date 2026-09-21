import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { OutfitCard, OutfitCardData } from "@/components/browse/OutfitCard";

interface SimilarOutfitsProps {
  outfits: OutfitCardData[];
  categoryName?: string;
  categorySlug?: string;
  wishlistedIds?: string[];
}

export function SimilarOutfits({
  outfits,
  categoryName,
  categorySlug,
  wishlistedIds = [],
}: SimilarOutfitsProps) {
  if (!outfits || outfits.length === 0) {
    return null;
  }

  const wishSet = new Set(wishlistedIds);

  return (
    <section className="mt-16 sm:mt-24 pt-12 border-t border-stone-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
            <Sparkles size={12} className="text-amber-600" />
            Curated Recommendations
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-stone-950">
            Similar in {categoryName || "Wedding Couture"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Handpicked designer outfits matching this silhouette and occasion
          </p>
        </div>

        {categorySlug && (
          <Link
            href={`/browse?category=${categorySlug}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-900 hover:text-rose-700 hover:underline transition-colors"
          >
            <span>View All {categoryName}</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {outfits.map((item) => (
          <OutfitCard
            key={item.id}
            outfit={item}
            initialWishlisted={wishSet.has(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
