import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MeasurementsData } from "@/components/outfit/OutfitMeasurements";
import { AvailabilityWindow } from "@/components/outfit/OutfitAvailability";
import { OutfitCardData } from "@/components/browse/OutfitCard";
import { MobileOutfitView } from "@/components/outfit/MobileOutfitView";
import { DesktopOutfitView } from "@/components/outfit/DesktopOutfitView";
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
  // Fetch active bookings for this outfit to merge into blocked availability windows
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("rental_start_date, rental_end_date, status")
    .eq("outfit_id", outfit.id)
    .not("status", "in", '("cancelled")');

  const bookingWindows: AvailabilityWindow[] = (activeBookings ?? []).map((b: { rental_start_date: string; rental_end_date: string }) => ({
    start_date: b.rental_start_date,
    end_date: b.rental_end_date,
    status: "blocked" as const,
  }));

  const rawAvailability = (outfit.availability as unknown as AvailabilityWindow[]) ?? [];
  const availability = [...rawAvailability, ...bookingWindows];

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
    <>
      {/* ── Mobile Native View (< lg) ── */}
      <div className="block lg:hidden">
        <MobileOutfitView
          outfit={{
            id: outfit.id,
            owner_id: outfit.owner_id,
            title: outfit.title,
            slug: outfit.slug,
            description: outfit.description,
            brand: outfit.brand,
            purchase_price: outfit.purchase_price,
            rental_price: outfit.rental_price,
            security_deposit: outfit.security_deposit,
            size: outfit.size,
            condition: outfit.condition,
            color: outfit.color,
            city: outfit.city,
            state: outfit.state,
            district: outfit.district,
            category: category,
            images: outfit.images,
            measurements: measurements,
          }}
          availability={availability}
          initialWishlisted={isOutfitWishlisted}
          similarOutfits={allSimilarOutfits}
          wishlistedIds={wishlistedIds}
        />
      </div>

      {/* ── Desktop View (>= lg) ── */}
      <div className="hidden lg:block">
        <DesktopOutfitView
          outfit={{
            id: outfit.id,
            owner_id: outfit.owner_id,
            title: outfit.title,
            slug: outfit.slug,
            description: outfit.description,
            brand: outfit.brand,
            rental_price: outfit.rental_price,
            purchase_price: outfit.purchase_price,
            security_deposit: outfit.security_deposit,
            size: outfit.size,
            condition: outfit.condition,
            color: outfit.color,
            city: outfit.city,
            state: outfit.state,
            district: outfit.district,
            images: outfit.images,
          }}
          category={category}
          measurements={measurements}
          availability={availability}
          isOutfitWishlisted={isOutfitWishlisted}
          primaryImageUrl={primaryImageUrl}
          similarOutfits={allSimilarOutfits}
          wishlistedIds={wishlistedIds}
        />
      </div>
    </>
  );
}
