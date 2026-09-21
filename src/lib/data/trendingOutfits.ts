import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OutfitCardData } from "@/components/browse/OutfitCard";

export const FALLBACK_TRENDING_OUTFITS: OutfitCardData[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Noor Mahal Crimson Velvet Bridal Lehenga",
    slug: "noor-mahal-crimson-velvet-bridal-lehenga",
    brand: "Sabyasachi Heritage Style",
    rental_price: 4999,
    security_deposit: 15000,
    size: "M",
    condition: "excellent",
    city: "Mumbai",
    state: "Maharashtra",
    district: "Mumbai Suburban",
    verification_status: "approved",
    category: {
      id: "cat-bridal",
      name: "Bridal Lehenga",
      slug: "bridal-lehenga",
      gender_type: "bride",
    },
    images: [
      {
        id: "img-1",
        storage_path: "/images/bridal_lehenga.jpg",
        image_type: "front",
        sort_order: 0,
      },
    ],
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    title: "Royal Jodhpur Ivory Zardozi Sherwani",
    slug: "royal-jodhpur-ivory-zardozi-sherwani",
    brand: "Tarun Tahiliani Inspired",
    rental_price: 3499,
    security_deposit: 12000,
    size: "L",
    condition: "excellent",
    city: "Delhi",
    state: "Delhi",
    district: "Central Delhi",
    verification_status: "approved",
    category: {
      id: "cat-sherwani",
      name: "Sherwani",
      slug: "sherwani",
      gender_type: "groom",
    },
    images: [
      {
        id: "img-2",
        storage_path: "/images/groom_sherwani.jpg",
        image_type: "front",
        sort_order: 0,
      },
    ],
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    title: "Emerald Constellation Cape Reception Gown",
    slug: "emerald-constellation-cape-reception-gown",
    brand: "Gaurav Gupta Aesthetic",
    rental_price: 2999,
    security_deposit: 10000,
    size: "S",
    condition: "good",
    city: "Bengaluru",
    state: "Karnataka",
    district: "Bengaluru Urban",
    verification_status: "approved",
    category: {
      id: "cat-gown",
      name: "Gown",
      slug: "gown",
      gender_type: "bride",
    },
    images: [
      {
        id: "img-3",
        storage_path: "/images/reception_gown.jpg",
        image_type: "front",
        sort_order: 0,
      },
    ],
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    title: "Kesariya Sunlit Floral Organza Lehenga",
    slug: "kesariya-sunlit-floral-organza-lehenga",
    brand: "Anushree Reddy Inspired",
    rental_price: 2499,
    security_deposit: 8000,
    size: "M",
    condition: "excellent",
    city: "Jaipur",
    state: "Rajasthan",
    district: "Jaipur",
    verification_status: "approved",
    category: {
      id: "cat-bridal-2",
      name: "Bridal Lehenga",
      slug: "bridal-lehenga",
      gender_type: "bride",
    },
    images: [
      {
        id: "img-4",
        storage_path: "/images/haldi_outfit.jpg",
        image_type: "front",
        sort_order: 0,
      },
    ],
  },
];

/**
 * Ensures featured outfits exist in the database so wishlisting works seamlessly.
 */
async function autoSeedFeaturedOutfitsIfEmpty() {
  try {
    const admin = createAdminClient();

    // Check if any outfits exist
    const { count } = await admin
      .from("outfits")
      .select("id", { count: "exact", head: true });

    if (count && count > 0) return;

    // Find any profile to attribute the outfits to
    const { data: owner } = await admin
      .from("profiles")
      .select("id")
      .order("role", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!owner) return;

    // Fetch category IDs
    const { data: categories } = await admin
      .from("categories")
      .select("id, slug");

    const categoryMap = new Map((categories || []).map((c) => [c.slug, c.id]));
    const defaultCatId =
      categoryMap.get("bridal-lehenga") || categories?.[0]?.id;

    if (!defaultCatId) return;

    for (const item of FALLBACK_TRENDING_OUTFITS) {
      const categoryId =
        (item.category?.slug ? categoryMap.get(item.category.slug) : null) ||
        defaultCatId;

      const { error: outfitErr } = await admin.from("outfits").upsert(
        {
          id: item.id,
          owner_id: owner.id,
          category_id: categoryId,
          title: item.title,
          slug: item.slug,
          brand: item.brand,
          rental_price: item.rental_price,
          security_deposit: item.security_deposit,
          size: item.size,
          condition: item.condition as "good" | "excellent",
          city: item.city,
          state: item.state,
          district: item.district,
          status: "published",
          verification_status: "approved",
        },
        { onConflict: "id" }
      );

      if (!outfitErr && item.images?.[0]) {
        await admin.from("outfit_images").upsert(
          {
            outfit_id: item.id,
            storage_path: item.images[0].storage_path,
            image_type: "front",
            sort_order: 0,
          },
          { onConflict: "outfit_id, storage_path" }
        );
      }
    }
  } catch (err) {
    console.warn("[autoSeedFeaturedOutfitsIfEmpty] Non-critical warning:", err);
  }
}

/**
 * Fetches trending outfits from Supabase for the Home Page,
 * including user's current wishlisted outfit IDs.
 */
export async function getTrendingOutfits(): Promise<{
  outfits: OutfitCardData[];
  wishlistedIds: string[];
}> {
  const supabase = await createClient();

  // 1. Fetch published outfits from Supabase
  let { data: rawOutfits } = await supabase
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
      category:categories (
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
    .eq("status", "published")
    .eq("verification_status", "approved")
    .order("created_at", { ascending: false })
    .limit(4);

  // If no published outfits, attempt auto-seed and retry query
  if (!rawOutfits || rawOutfits.length === 0) {
    await autoSeedFeaturedOutfitsIfEmpty();

    const { data: retryOutfits } = await supabase
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
        category:categories (
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
      .eq("status", "published")
      .eq("verification_status", "approved")
      .order("created_at", { ascending: false })
      .limit(4);

    rawOutfits = retryOutfits;
  }

  // 2. Fetch authenticated user's wishlist IDs
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

  const outfits = (rawOutfits as unknown as OutfitCardData[]) || [];

  return {
    outfits: outfits.length > 0 ? outfits : FALLBACK_TRENDING_OUTFITS,
    wishlistedIds,
  };
}
