import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, PackageOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrowseFilters } from "@/components/browse/BrowseFilters";
import { BrowseSort } from "@/components/browse/BrowseSort";
import { BrowseSearchBar } from "@/components/browse/BrowseSearchBar";
import { CategoryChips } from "@/components/browse/CategoryChips";
import { OutfitCard, OutfitCardData } from "@/components/browse/OutfitCard";

export const metadata: Metadata = {
  title: "Wedding Outfits on Rent | ShaadiRent",
  description: "Discover wedding outfits available for rent on ShaadiRent.",
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    gender?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    location?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const category = params.category || "";
  const gender = params.gender || "all";
  const minPrice = params.minPrice || "";
  const maxPrice = params.maxPrice || "";
  const size = params.size || "";
  const location = params.location || "";
  const sort = params.sort || "recommended";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const supabase = await createClient();

  // 1. Fetch active categories for dynamic category filter chips
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, slug, gender_type")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const categories = rawCategories ?? [];
  const selectedCategoryObj = categories.find((c) => c.slug === category);

  // 2. Build query for published & approved outfits
  let query = supabase
    .from("outfits")
    .select(
      `
      id,
      title,
      slug,
      brand,
      rental_price,
      security_deposit,
      size,
      condition,
      city,
      district,
      state,
      status,
      verification_status,
      created_at,
      category:categories!inner (
        id,
        name,
        slug,
        gender_type
      ),
      images:outfit_images (
        id,
        storage_path,
        image_type,
        sort_order
      )
    `,
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("verification_status", "approved");

  // Search filter
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  // Category filter
  if (category) {
    query = query.eq("category.slug", category);
  }

  // Gender filter
  if (gender && gender !== "all") {
    query = query.eq("category.gender_type", gender);
  }

  // Price range filters
  if (minPrice && !isNaN(Number(minPrice))) {
    query = query.gte("rental_price", Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    query = query.lte("rental_price", Number(maxPrice));
  }

  // Size filter
  if (size) {
    query = query.ilike("size", `%${size}%`);
  }

  // Location filter
  if (location) {
    query = query.or(
      `city.ilike.%${location}%,district.ilike.%${location}%,state.ilike.%${location}%`
    );
  }

  // Sorting
  if (sort === "price_asc") {
    query = query.order("rental_price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("rental_price", { ascending: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    // "recommended" default: newest arrivals
    query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: rawOutfits, count: totalCount, error } = await query;

  if (error) {
    console.error("Browse query error:", error.message);
  }

  const outfits = (rawOutfits as unknown as OutfitCardData[]) || [];
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fetch wishlisted outfit IDs for authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlistedIds = new Set<string>();
  if (user) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("outfit_id")
      .eq("user_id", user.id);
    if (wishRows) {
      wishlistedIds = new Set(wishRows.map((r) => r.outfit_id));
    }
  }

  // Helper to build pagination links preserving active query params
  const createPageUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (gender && gender !== "all") p.set("gender", gender);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (size) p.set("size", size);
    if (location) p.set("location", location);
    if (sort && sort !== "recommended") p.set("sort", sort);
    if (pageNumber > 1) p.set("page", pageNumber.toString());
    const qs = p.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24">
      {/* ── Top Header Section ── */}
      <div className="border-b border-stone-200/70 bg-gradient-to-b from-rose-50/40 via-white to-transparent pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 sm:mb-6"
          >
            <Link
              href="/"
              className="hover:text-rose-900 transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={13} className="text-stone-400 shrink-0" />
            <Link
              href="/browse"
              className={
                !category
                  ? "text-stone-900 font-semibold"
                  : "hover:text-rose-900 transition-colors"
              }
            >
              Browse
            </Link>
            {selectedCategoryObj && (
              <>
                <ChevronRight size={13} className="text-stone-400 shrink-0" />
                <span className="text-stone-900 font-semibold truncate">
                  {selectedCategoryObj.name}
                </span>
              </>
            )}
          </nav>

          {/* Page Heading + Result Count */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-950">
              Wedding Outfits for Your Special Day
            </h1>
            <p className="text-xs sm:text-base text-stone-600">
              Discover verified wedding outfits available for rent.
            </p>
            <p className="text-xs text-stone-500 font-medium pt-1">
              Showing {total} {total === 1 ? "outfit" : "outfits"}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-6 sm:mt-8">
            <BrowseSearchBar initialQuery={q} />
          </div>

          {/* Category Chips */}
          <div className="mt-6 sm:mt-8">
            <CategoryChips
              categories={categories}
              selectedCategory={category}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Area: Filters + Grid ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Mobile Sticky Filter & Sort Toolbar */}
        <div className="sticky top-14 z-20 flex lg:hidden items-center justify-between gap-3 mb-6 py-3 px-4 -mx-4 sm:-mx-6 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/70 shadow-2xs">
          <BrowseFilters
            mode="mobile"
            categories={categories}
            selectedCategory={category}
            selectedGender={gender}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            selectedSize={size}
            selectedLocation={location}
            searchQuery={q}
          />

          <BrowseSort currentSort={sort} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Left Filter Sidebar (Sticky) */}
          <BrowseFilters
            mode="desktop"
            categories={categories}
            selectedCategory={category}
            selectedGender={gender}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            selectedSize={size}
            selectedLocation={location}
            searchQuery={q}
          />

          {/* Right Main Feed */}
          <div className="flex-1 w-full space-y-6">
            {/* Desktop Toolbar: Result summary + Sort */}
            <div className="hidden lg:flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white px-5 py-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                <span className="font-semibold text-stone-950">
                  {total} {total === 1 ? "Outfit" : "Outfits"} Found
                </span>
                {selectedCategoryObj && (
                  <span className="text-stone-500">
                    in <strong className="text-rose-900">{selectedCategoryObj.name}</strong>
                  </span>
                )}
                {q && (
                  <span className="text-stone-500">
                    for &ldquo;<strong className="text-stone-900">{q}</strong>&rdquo;
                  </span>
                )}
              </div>

              <BrowseSort currentSort={sort} />
            </div>

            {/* Outfits Grid or Empty State */}
            {outfits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {outfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    initialWishlisted={wishlistedIds.has(outfit.id)}
                  />
                ))}
              </div>
            ) : (
              /* ── Luxury Empty State ── */
              <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-8 sm:p-14 text-center shadow-2xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-800">
                  <PackageOpen size={32} />
                </div>

                <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-stone-900">
                  No outfits found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 leading-relaxed">
                  Try changing your filters or search terms.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/browse"
                    className="rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-rose-950 hover:bg-rose-100 transition-colors"
                  >
                    Clear Filters
                  </Link>

                  <Link
                    href="/rent-your-outfit"
                    className="rounded-xl bg-stone-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-black transition-colors"
                  >
                    List Your Outfit
                  </Link>
                </div>
              </div>
            )}

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={createPageUrl(currentPage - 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </Link>
                )}

                <div className="flex items-center gap-1 px-3 text-xs font-semibold text-stone-600">
                  Page {currentPage} of {totalPages}
                </div>

                {currentPage < totalPages && (
                  <Link
                    href={createPageUrl(currentPage + 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
