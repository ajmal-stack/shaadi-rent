import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function BentoGrid() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-800">
              <Sparkles size={13} className="text-amber-600" />
              Curated Wardrobe
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950">
              Explore Wedding Collections
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl">
              From auspicious bridal pheras to electric sangeet nights, rent verified couture pieces crafted for every ceremony.
            </p>
          </div>

          <Link
            href="/browse"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-rose-800 hover:text-rose-950 group"
          >
            <span>View All Outfits</span>
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* ── Asymmetric Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Card 1: Bridal Lehengas (Spans 2 cols, 2 rows on large screens) */}
          <Link
            href="/browse?category=lehengas"
            className="group relative overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 min-h-[460px] lg:min-h-[560px] flex flex-col justify-end p-6 sm:p-8 bg-stone-900 shadow-lg"
          >
            <Image
              src="/images/bridal_lehenga.jpg"
              alt="Bridal Lehengas Collection"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-95"
            />
            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            <div className="relative z-10 space-y-2">
              <span className="inline-block rounded-full bg-rose-700/90 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                Most Popular
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Bridal Lehengas
              </h3>
              <p className="text-xs sm:text-sm text-stone-200/90 max-w-md line-clamp-2">
                Pure raw silk, hand-stitched zardozi embroidery & heritage velvet lehengas for your most sacred moments.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">
                  Rent from ₹3,999 · Retail up to ₹1,50,000
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Groom Sherwanis */}
          <Link
            href="/browse?category=sherwanis"
            className="group relative overflow-hidden rounded-3xl min-h-[260px] lg:min-h-[300px] flex flex-col justify-end p-6 bg-stone-900 shadow-md"
          >
            <Image
              src="/images/groom_sherwani.jpg"
              alt="Groom Sherwanis Collection"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            <div className="relative z-10 space-y-1.5">
              <h3 className="font-display text-xl font-bold text-white">
                Groom&apos;s Sherwanis
              </h3>
              <p className="text-xs text-stone-200 line-clamp-1">
                Regal bandhgalas, ivory silks & matching safa sets.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-amber-300">
                  Rent from ₹2,999
                </span>
                <ArrowUpRight size={16} className="text-white" />
              </div>
            </div>
          </Link>

          {/* Card 3: Reception & Cocktail Gowns */}
          <Link
            href="/browse?category=gowns"
            className="group relative overflow-hidden rounded-3xl min-h-[260px] lg:min-h-[300px] flex flex-col justify-end p-6 bg-stone-900 shadow-md"
          >
            <Image
              src="/images/reception_gown.jpg"
              alt="Reception Gowns Collection"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            <div className="relative z-10 space-y-1.5">
              <h3 className="font-display text-xl font-bold text-white">
                Reception Gowns
              </h3>
              <p className="text-xs text-stone-200 line-clamp-1">
                Sculpted sequins, cape gowns & modern trails.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-amber-300">
                  Rent from ₹2,499
                </span>
                <ArrowUpRight size={16} className="text-white" />
              </div>
            </div>
          </Link>

          {/* Card 4: Haldi & Mehendi Sunshine */}
          <Link
            href="/browse?category=haldi"
            className="group relative overflow-hidden rounded-3xl min-h-[240px] flex flex-col justify-end p-6 bg-stone-900 shadow-md"
          >
            <Image
              src="/images/haldi_outfit.jpg"
              alt="Haldi and Mehendi Outfits"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            <div className="relative z-10 space-y-1.5">
              <h3 className="font-display text-xl font-bold text-white">
                Haldi & Mehendi
              </h3>
              <p className="text-xs text-stone-200 line-clamp-1">
                Mirror-work organzas, cheerful marigold yellows.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-amber-300">
                  Rent from ₹1,999
                </span>
                <ArrowUpRight size={16} className="text-white" />
              </div>
            </div>
          </Link>

          {/* Card 5: Royal Heritage Jewellery (Editorial Card) */}
          <Link
            href="/browse?category=jewellery"
            className="group relative overflow-hidden rounded-3xl min-h-[240px] flex flex-col justify-between p-6 bg-gradient-to-br from-rose-950 via-stone-900 to-amber-950 text-white shadow-md border border-rose-900/40"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 text-lg">
                💎
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white group-hover:scale-110 transition-transform">
                <ArrowUpRight size={16} />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Accessories
              </span>
              <h3 className="font-display text-xl font-bold text-white">
                Heritage Jewellery
              </h3>
              <p className="text-xs text-stone-300">
                Polki, Kundan & temple choker sets to complete your royal ensemble.
              </p>
              <p className="text-xs font-semibold text-amber-300 pt-1">
                Starting at ₹999
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
