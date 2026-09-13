import Link from "next/link";
import { Sparkles, SlidersHorizontal, Search } from "lucide-react";

interface BrowsePageProps {
  searchParams?: Promise<{ q?: string; category?: string }>;
}

const CATEGORIES = [
  { id: "all", name: "All Collections" },
  { id: "lehengas", name: "Bridal Lehengas" },
  { id: "sherwanis", name: "Groom Sherwanis" },
  { id: "gowns", name: "Reception Gowns" },
  { id: "anarkalis", name: "Anarkalis & Suits" },
  { id: "jewellery", name: "Jewellery & Accessories" },
];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q || "";

  return (
    <div className="min-h-screen bg-stone-50/50 pb-16">
      {/* Hero Banner */}
      <div className="border-b border-rose-100/70 bg-gradient-to-b from-rose-50/60 via-white to-transparent py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-800">
            <Sparkles size={13} className="text-amber-600" />
            Curated Designer Wardrobe
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            Browse Wedding Outfits
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-gray-600">
            Rent luxury wedding attire from top couturiers. Verified fits, dry-cleaned & delivered to your doorstep.
          </p>

          {query && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs border border-rose-100">
              <Search size={14} className="text-rose-700" />
              <span>
                Search results for <strong className="text-rose-900">&ldquo;{query}&rdquo;</strong>
              </span>
              <Link href="/browse" className="ml-2 text-rose-600 hover:underline">
                Clear
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Category Pills & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  cat.id === "all"
                    ? "bg-rose-900 text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </div>

        {/* Empty / Placeholder State */}
        <div className="mt-12 rounded-3xl border border-dashed border-rose-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <Sparkles size={28} />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
            Outfits Catalogue Loading Soon
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            We are curating hand-embroidered Lehengas, velvet Sherwanis, and bespoke designer wedding wear. Check back shortly!
          </p>
          <div className="mt-6">
            <Link
              href="/rent-your-outfit"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors"
            >
              List Your Outfit to Rent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
