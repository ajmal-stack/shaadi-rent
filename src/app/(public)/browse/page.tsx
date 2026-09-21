import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight, PackageOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrowseFilters } from "@/components/browse/BrowseFilters";
import { BrowseSort } from "@/components/browse/BrowseSort";
import { BrowseSearchBar } from "@/components/browse/BrowseSearchBar";
import { CategoryChips } from "@/components/browse/CategoryChips";
import { OutfitCard, OutfitCardData } from "@/components/browse/OutfitCard";
import { ActiveFilterBadges } from "@/components/browse/ActiveFilterBadges";

export const metadata: Metadata = {
  title: "Wedding Outfits on Rent | ShaadiRent",
  description: "Discover verified wedding outfits available for rent on ShaadiRent.",
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
    eventDate?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

// ── In-Memory Caches for Static / Infrequent DB Lookups (5-minute TTL) ──────
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

let cachedCategories: CacheEntry<Array<{ id: string; name: string; slug: string; gender_type: string }>> | null = null;
let cachedCities: CacheEntry<string[]> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCategories(supabase: any) {
  const now = Date.now();
  if (cachedCategories && now < cachedCategories.expiry) {
    return cachedCategories.data;
  }
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, gender_type")
    .eq("is_active", true)
    .order("name", { ascending: true });
  const result = data ?? [];
  cachedCategories = { data: result, expiry: now + CACHE_TTL_MS };
  return result;
}

async function getAvailableCities(supabase: any) {
  const now = Date.now();
  if (cachedCities && now < cachedCities.expiry) {
    return cachedCities.data;
  }
  const { data: cityRows } = await supabase
    .from("outfits")
    .select("city")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .not("city", "is", null);

  const result = Array.from(
    new Set(
      (cityRows || [])
        .map((r: any) => r.city?.trim())
        .filter((c: any): c is string => Boolean(c))
    )
  ).sort();
  cachedCities = { data: result, expiry: now + CACHE_TTL_MS };
  return result;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const category = params.category || "";
  const gender = params.gender || "all";
  const minPrice = params.minPrice || "";
  const maxPrice = params.maxPrice || "";
  const size = params.size || "";
  const location = params.location || "";
  const eventDate = params.eventDate || "";
  const sort = params.sort || "recommended";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const supabase = await createClient();

  // 1. Calculate date availability conflicts if eventDate is provided (TASK 10.1)
  let unavailableOutfitIds: string[] = [];
  if (eventDate) {
    try {
      const evDate = new Date(eventDate);
      if (!isNaN(evDate.getTime())) {
        // 4-day rental window (delivery 2 days before event, return 1 day after)
        const delDate = new Date(evDate);
        delDate.setDate(delDate.getDate() - 2);
        const retDate = new Date(evDate);
        retDate.setDate(retDate.getDate() + 1);

        const delStr = delDate.toISOString().slice(0, 10);
        const retStr = retDate.toISOString().slice(0, 10);

        // Run both conflict checks concurrently
        const [{ data: blockedAvail }, { data: bookedOutfits }] = await Promise.all([
          supabase
            .from("outfit_availability")
            .select("outfit_id")
            .in("status", ["blocked", "maintenance"])
            .lte("start_date", retStr)
            .gte("end_date", delStr),
          supabase
            .from("bookings")
            .select("outfit_id")
            .not("status", "in", '("cancelled","refunded")')
            .lte("rental_start_date", retStr)
            .gte("rental_end_date", delStr),
        ]);

        const blockedIds = (blockedAvail || []).map((r: any) => r.outfit_id);
        const bookedIds = (bookedOutfits || []).map((r: any) => r.outfit_id);
        unavailableOutfitIds = Array.from(
          new Set([...blockedIds, ...bookedIds])
        );
      }
    } catch (err) {
      console.error("[BrowsePage] Error calculating date conflicts:", err);
    }
  }

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
      purchase_price,
      security_deposit,
      size,
      condition,
      city,
      district,
      state,
      status,
      verification_status,
      created_at,
      category:categories${category || (gender && gender !== "all") ? "!inner" : ""} (
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

  // Filter out outfits with date conflicts (TASK 10.1)
  if (unavailableOutfitIds.length > 0) {
    query = query.not("id", "in", `(${unavailableOutfitIds.join(",")})`);
  }

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

  // Size filter (Single or Multi-select) (TASK 10.2)
  if (size) {
    const sizeList = size
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (sizeList.length === 1) {
      query = query.ilike("size", `%${sizeList[0]}%`);
    } else if (sizeList.length > 1) {
      const orClauses = sizeList.map((s) => `size.ilike.%${s}%`).join(",");
      query = query.or(orClauses);
    }
  }

  // Location filter (TASK 10.3)
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

  // 3. Fast-path auth check using cookies and getSession() to avoid blocking network call
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  const [categories, availableCities, outfitsRes, sessionRes] = await Promise.all([
    getCategories(supabase),
    getAvailableCities(supabase),
    query,
    hasAuthCookie
      ? supabase.auth.getSession()
      : Promise.resolve({ data: { session: null } }),
  ]);

  const rawOutfits = outfitsRes.data;
  const totalCount = outfitsRes.count;
  if (outfitsRes.error) {
    console.error("Browse query error:", outfitsRes.error.message);
  }

  const outfits = (rawOutfits as unknown as OutfitCardData[]) || [];
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const selectedCategoryObj = categories.find((c: any) => c.slug === category);

  // Fetch wishlisted outfit IDs for authenticated user (if logged in)
  let wishlistedIds = new Set<string>();
  const userId = sessionRes?.data?.session?.user?.id;
  if (userId) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("outfit_id")
      .eq("user_id", userId);
    if (wishRows) {
      wishlistedIds = new Set(wishRows.map((r: any) => r.outfit_id));
    }
  }

  // Helper to build pagination links preserving all active query params (TASK 10.4)
  const createPageUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (gender && gender !== "all") p.set("gender", gender);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (size) p.set("size", size);
    if (location) p.set("location", location);
    if (eventDate) p.set("eventDate", eventDate);
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
        <div className="sticky top-14 md:top-16 z-20 flex lg:hidden items-center justify-between gap-2.5 mb-6 py-3 px-4 sm:px-6 -mx-4 sm:-mx-6 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs transition-all">
          <div className="flex items-center gap-2">
            <BrowseFilters
              mode="mobile"
              categories={categories}
              selectedCategory={category}
              selectedGender={gender}
              selectedMinPrice={minPrice}
              selectedMaxPrice={maxPrice}
              selectedSize={size}
              selectedLocation={location}
              selectedEventDate={eventDate}
              availableCities={availableCities}
              searchQuery={q}
              totalOutfits={total}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              {total} {total === 1 ? "outfit" : "outfits"}
            </span>
            <BrowseSort currentSort={sort} />
          </div>
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
            selectedEventDate={eventDate}
            availableCities={availableCities}
            searchQuery={q}
            totalOutfits={total}
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

            {/* Active Filters Bar (TASK 10.4) */}
            <ActiveFilterBadges
              categoryName={selectedCategoryObj?.name}
              gender={gender}
              minPrice={minPrice}
              maxPrice={maxPrice}
              size={size}
              location={location}
              eventDate={eventDate}
              query={q}
            />

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
                  Try adjusting or clearing your filters to see more designer wedding wear.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/browse"
                    className="rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-rose-950 hover:bg-rose-100 transition-colors"
                  >
                    Clear All Filters
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
