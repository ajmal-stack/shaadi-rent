"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { OutfitCard, OutfitCardData } from "@/components/browse/OutfitCard";

interface WishlistGridProps {
  initialOutfits: OutfitCardData[];
}

export function WishlistGrid({ initialOutfits }: WishlistGridProps) {
  const [outfits, setOutfits] = useState<OutfitCardData[]>(initialOutfits);

  const handleWishlistChange = (outfitId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Remove from view smoothly
      setOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    }
  };

  if (outfits.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-8 sm:p-16 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-2xs">
          <Heart size={32} className="stroke-[1.75]" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            You haven&apos;t saved any outfits yet. Bookmark your favorite bridal lehengas, sherwanis, and wedding couture while browsing to compare them later.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all active:scale-95"
          >
            <Sparkles size={16} />
            <span>Explore Bridal &amp; Groom Outfits</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
        <span>
          Showing <strong className="text-stone-900">{outfits.length}</strong> saved outfit{outfits.length !== 1 ? "s" : ""}
        </span>
        <Link
          href="/browse"
          className="font-semibold text-rose-800 hover:text-rose-950 transition-colors flex items-center gap-1"
        >
          <span>Find more outfits</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {outfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            initialWishlisted={true}
            onWishlistChange={handleWishlistChange}
          />
        ))}
      </div>
    </div>
  );
}
