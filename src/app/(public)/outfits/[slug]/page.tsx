import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Sparkles,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OutfitGallery } from "@/components/outfit/OutfitGallery";
import { OutfitMeasurements, MeasurementsData } from "@/components/outfit/OutfitMeasurements";
import { OutfitAvailability, AvailabilityWindow } from "@/components/outfit/OutfitAvailability";
import { OutfitActionCard } from "@/components/outfit/OutfitActionCard";
import { SimilarOutfits } from "@/components/outfit/SimilarOutfits";
import { OutfitCardData } from "@/components/browse/OutfitCard";
import { getOutfitImageUrl } from "@/lib/utils/image";

interface OutfitDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface CategoryJoin {
  id: string;
  name: string;
  slug: string;
  gender_type: string;
}

export async function generateMetadata({
  params,
}: OutfitDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: outfit } = await supabase
    .from("outfits")
    .select("title, description, brand, color, category:categories(name, gender_type), images:outfit_images(storage_path, sort_order)")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("verification_status", "approved")
    .single();

  if (!outfit) {
    return {
      title: "Outfit Not Found — ShaadiRent",
    };
  }

  const categoryName = (outfit.category as unknown as { name: string } | null)?.name ?? "Wedding Couture";
  const title = `${outfit.title} on Rent | ${categoryName} — ShaadiRent`;
  const description =
    outfit.description ||
    `Rent ${outfit.title} by ${outfit.brand || "designer"} for your wedding occasion. Delivered sanitized 48 hours early with free backup sizing.`;

  const sortedImages = (outfit.images || []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryImage = sortedImages[0]?.storage_path;
  const imageUrl = getOutfitImageUrl(primaryImage);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shaadirent.com";
  const outfitUrl = `${siteUrl}/outfits/${slug}`;

  return {
    title,
    description,
    keywords: [
      outfit.title,
      outfit.brand || "",
      categoryName,
      outfit.color || "",
      "wedding outfit rental",
      "bridal lehenga on rent",
      "groom sherwani rental India",
      "designer bridal wear",
    ].filter(Boolean),
    alternates: {
      canonical: outfitUrl,
    },
    openGraph: {
      title,
      description,
      url: outfitUrl,
      siteName: "ShaadiRent",
      locale: "en_IN",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: outfit.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function OutfitDetailPage({ params }: OutfitDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch complete outfit details with relations
  const { data: outfit, error } = await supabase
    .from("outfits")
    .select(
      `
      id,
      owner_id,
      title,
      slug,
      description,
      brand,
      purchase_price,
      rental_price,
      security_deposit,
      size,
      condition,
      color,
      status,
      verification_status,
      city,
      district,
      state,
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
      ),
      measurements:outfit_measurements (
        bust,
        waist,
        hip,
        shoulder,
        length,
        sleeve_length,
        custom_measurements
      ),
      availability:outfit_availability (
        start_date,
        end_date,
        status
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("verification_status", "approved")
    .single();

  if (error || !outfit) {
    notFound();
  }

  const category = outfit.category as unknown as CategoryJoin;
  const measurements = (Array.isArray(outfit.measurements)
    ? outfit.measurements[0]
    : outfit.measurements) as unknown as MeasurementsData | null;
  const availability = (outfit.availability as unknown as AvailabilityWindow[]) ?? [];

  // Fetch current user wishlist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlistedIds: string[] = [];
  if (user) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("outfit_id")
      .eq("user_id", user.id);
    if (wishRows) {
      wishlistedIds = wishRows.map((r) => r.outfit_id);
    }
  }

  const isOutfitWishlisted = wishlistedIds.includes(outfit.id);

  // Extract primary image URL for action card & share preview
  const sortedImages = (outfit.images || [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryImage = sortedImages[0]?.storage_path;
  const primaryImageUrl = getOutfitImageUrl(primaryImage);

  // Fetch similar outfits from the same category
  const { data: categorySimilarData } = await supabase
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
      state,
      district,
      verification_status,
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
    `
    )
    .eq("category_id", category.id)
    .eq("status", "published")
    .eq("verification_status", "approved")
    .neq("id", outfit.id)
    .limit(4);

  let allSimilarOutfits = (categorySimilarData as unknown as OutfitCardData[]) ?? [];

  // Smart backfill: if fewer than 4 outfits in this exact category, recommend outfits with same wearer/gender type
  if (allSimilarOutfits.length < 4 && category?.gender_type) {
    const existingIds = [outfit.id, ...allSimilarOutfits.map((o) => o.id)];
    const needed = 4 - allSimilarOutfits.length;

    const { data: fallbackData } = await supabase
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
        state,
        district,
        verification_status,
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
      `
      )
      .eq("category.gender_type", category.gender_type)
      .eq("status", "published")
      .eq("verification_status", "approved")
      .not("id", "in", `(${existingIds.join(",")})`)
      .limit(needed);

    if (fallbackData && fallbackData.length > 0) {
      allSimilarOutfits = [
        ...allSimilarOutfits,
        ...(fallbackData as unknown as OutfitCardData[]),
      ];
    }
  }

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-12 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Breadcrumbs ── */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 text-xs text-stone-500 mb-8 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-stone-300 shrink-0" />
          <Link href="/browse" className="hover:text-stone-900 transition-colors">
            Browse
          </Link>
          {category && (
            <>
              <ChevronRight size={13} className="text-stone-300 shrink-0" />
              <Link
                href={`/browse?category=${category.slug}`}
                className="hover:text-stone-900 transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-stone-300 shrink-0" />
          <span className="font-semibold text-stone-900 truncate max-w-xs">
            {outfit.title}
          </span>
        </nav>

        {/* ── Main Layout: Two Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column (Images, Measurements, Story, Care) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Multi-Angle Image Gallery */}
            <OutfitGallery
              images={outfit.images}
              outfitTitle={outfit.title}
            />

            {/* 2. Garment Story & Description */}
            <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
                <Sparkles size={12} className="text-amber-600" />
                Couture Details
              </span>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
                Design & Craftsmanship
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {outfit.description ||
                  "Handcrafted with exquisite attention to detail. Featuring traditional zardozi embroidery and royal motifs on premium fabric. Tailored for wedding celebrations, pheras, and grand reception evenings."}
              </p>

              {/* Garment Highlights Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-100 text-xs">
                {outfit.color && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Color
                    </span>
                    <span className="font-semibold text-stone-800">{outfit.color}</span>
                  </div>
                )}
                {category?.gender_type && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Occasion
                    </span>
                    <span className="font-semibold text-stone-800 capitalize">
                      {category.gender_type} Wear
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Authenticity
                  </span>
                  <span className="font-semibold text-emerald-700">
                    100% Certified Original
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Measurements & Alteration Specs */}
            <OutfitMeasurements
              measurements={measurements}
              size={outfit.size}
            />

            {/* 4. Availability Window */}
            <OutfitAvailability availability={availability} />

            {/* 5. Safe Owner & Location Context */}
            <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900">
                    Curated by Verified Partner
                  </h3>
                  <p className="text-xs text-stone-500">
                    Location: {outfit.city ? `${outfit.city}, ${outfit.state || "India"}` : "Pan-India Hub"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                This piece is listed by a verified boutique partner in our luxury rental network. Every dispatch is backed by the <strong className="text-stone-900">ShaadiRent Quality Shield</strong> with secure insured transit and doorstep exchange if fit issues arise.
              </p>
            </div>
          </div>

          {/* Right Column (Sticky Action Card) */}
          <div className="lg:col-span-5">
            <OutfitActionCard
              outfit={{
                id: outfit.id,
                owner_id: outfit.owner_id,
                title: outfit.title,
                slug: outfit.slug,
                brand: outfit.brand,
                rental_price: outfit.rental_price,
                purchase_price: outfit.purchase_price,
                security_deposit: outfit.security_deposit,
                size: outfit.size,
                condition: outfit.condition,
                city: outfit.city,
                state: outfit.state,
                categoryName: category?.name,
                imageUrl: primaryImageUrl,
              }}
              availability={availability}
              initialWishlisted={isOutfitWishlisted}
            />
          </div>
        </div>

        {/* ── Similar Outfits in Same Category ── */}
        <SimilarOutfits
          outfits={allSimilarOutfits}
          categoryName={category?.name}
          categorySlug={category?.slug}
          wishlistedIds={wishlistedIds}
        />
      </div>
    </div>
  );
}
