"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

interface OutfitItem {
  id: string;
  title: string;
  designer: string;
  category: string;
  image: string;
  rentalPrice: number;
  retailPrice: number;
  duration: string;
  tag: string;
}

const FEATURED_OUTFITS: OutfitItem[] = [
  {
    id: "1",
    title: "Noor Mahal Crimson Velvet Bridal Lehenga",
    designer: "Sabyasachi Heritage Style",
    category: "Bridal",
    image: "/images/bridal_lehenga.jpg",
    rentalPrice: 4999,
    retailPrice: 75000,
    duration: "4 Days Rental",
    tag: "Free Backup Sizing Included",
  },
  {
    id: "2",
    title: "Royal Jodhpur Ivory Zardozi Sherwani",
    designer: "Tarun Tahiliani Inspired",
    category: "Groom",
    image: "/images/groom_sherwani.jpg",
    rentalPrice: 3499,
    retailPrice: 52000,
    duration: "4 Days Rental",
    tag: "Includes Safa & Stole",
  },
  {
    id: "3",
    title: "Emerald Constellation Cape Reception Gown",
    designer: "Gaurav Gupta Aesthetic",
    category: "Reception",
    image: "/images/reception_gown.jpg",
    rentalPrice: 2999,
    retailPrice: 42000,
    duration: "4 Days Rental",
    tag: "Pre-steamed & Sanitized",
  },
  {
    id: "4",
    title: "Kesariya Sunlit Floral Organza Lehenga",
    designer: "Anushree Reddy Inspired",
    category: "Haldi",
    image: "/images/haldi_outfit.jpg",
    rentalPrice: 2499,
    retailPrice: 38000,
    duration: "4 Days Rental",
    tag: "Lightweight for Dancing",
  },
];

export function TrendingOutfits() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

        {/* ── 3:4 Aspect Ratio Product Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {FEATURED_OUTFITS.map((outfit) => {
            const savingsPercent = Math.round(
              ((outfit.retailPrice - outfit.rentalPrice) / outfit.retailPrice) * 100
            );
            const isLiked = wishlist.includes(outfit.id);

            return (
              <div
                key={outfit.id}
                className="group flex flex-col rounded-3xl border border-rose-100/80 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image Container (3:4 Ratio) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                  <Image
                    src={outfit.image}
                    alt={outfit.title}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="rounded-full bg-emerald-700/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-sm">
                      Save {savingsPercent}%
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(outfit.id)}
                      aria-label="Add to wishlist"
                      className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-stone-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
                    >
                      <Heart
                        size={16}
                        className={isLiked ? "fill-rose-600 text-rose-600" : ""}
                      />
                    </button>
                  </div>

                  {/* Free Backup Fit Pill */}
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-stone-950/80 px-2.5 py-1 text-[10px] font-medium text-amber-200 backdrop-blur-md shadow-xs">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      {outfit.tag}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      {outfit.designer}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-stone-900 line-clamp-1 group-hover:text-rose-800 transition-colors">
                      {outfit.title}
                    </h3>
                  </div>

                  {/* Price Anchoring (Rental vs MRP) */}
                  <div className="border-t border-stone-100 pt-3 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-stone-950">
                          ₹{outfit.rentalPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-stone-400 line-through">
                          ₹{outfit.retailPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-medium">
                        {outfit.duration}
                      </p>
                    </div>

                    <Link
                      href={`/browse?q=${encodeURIComponent(outfit.title)}`}
                      className="rounded-xl bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors active:scale-95"
                    >
                      Reserve
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
