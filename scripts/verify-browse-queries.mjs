import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

// Anonymous client — exactly matching public browser /browse SSR
const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verify() {
  console.log("🔍 Verifying Public Customer /browse Queries with Anonymous Client...\n");

  let passes = 0;
  let fails = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
      passes++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      fails++;
    }
  }

  // 1. Base Query: All published & approved outfits
  const { data: allOutfits, error: err1 } = await supabase
    .from("outfits")
    .select(
      `
      id, title, slug, brand, rental_price, security_deposit, size,
      condition, city, status, verification_status,
      category:categories!inner (id, name, slug, gender_type),
      images:outfit_images (id, storage_path, sort_order)
    `,
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("verification_status", "approved");

  assert(!err1 && allOutfits?.length === 16, "All Outfits Query", `Found ${allOutfits?.length}/16 outfits`);

  // 2. Category Filter: bridal-lehenga
  const { data: lehengas, error: err2 } = await supabase
    .from("outfits")
    .select(
      `id, title, category:categories!inner(slug)`
    )
    .eq("status", "published")
    .eq("verification_status", "approved")
    .eq("category.slug", "bridal-lehenga");

  assert(!err2 && lehengas?.length === 3, "Category Filter: bridal-lehenga", `Found ${lehengas?.length}/3 lehengas`);

  // 3. Category Filter: sherwani
  const { data: sherwanis, error: err3 } = await supabase
    .from("outfits")
    .select(
      `id, title, category:categories!inner(slug)`
    )
    .eq("status", "published")
    .eq("verification_status", "approved")
    .eq("category.slug", "sherwani");

  assert(!err3 && sherwanis?.length === 3, "Category Filter: sherwani", `Found ${sherwanis?.length}/3 sherwanis`);

  // 4. Keyword Search: "Sabyasachi"
  const { data: sabyasachi, error: err4 } = await supabase
    .from("outfits")
    .select("id, title, brand")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .or("title.ilike.%Sabyasachi%,brand.ilike.%Sabyasachi%,description.ilike.%Sabyasachi%");

  assert(!err4 && sabyasachi?.length >= 1, "Keyword Search: 'Sabyasachi'", `Found ${sabyasachi?.length} item(s): ${sabyasachi?.[0]?.title}`);

  // 5. Price Range Filter: Under ₹4,000 (rental_price <= 4000)
  const { data: under4k, error: err5 } = await supabase
    .from("outfits")
    .select("id, title, rental_price")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .lte("rental_price", 4000);

  assert(!err5 && under4k?.length > 0, "Price Filter: <= ₹4,000", `Found ${under4k?.length} outfits`);

  // 6. Size Filter: "M"
  const { data: sizeM, error: err6 } = await supabase
    .from("outfits")
    .select("id, title, size")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .ilike("size", "%M%");

  assert(!err6 && sizeM?.length > 0, "Size Filter: 'M'", `Found ${sizeM?.length} outfits in size M`);

  // 7. Location Filter: "Delhi NCR"
  const { data: delhiOutfits, error: err7 } = await supabase
    .from("outfits")
    .select("id, title, city")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .ilike("city", "%Delhi NCR%");

  assert(!err7 && delhiOutfits?.length > 0, "Location Filter: 'Delhi NCR'", `Found ${delhiOutfits?.length} outfits in Delhi NCR`);

  // 8. Sorting: Price Low to High
  const { data: sortedAsc, error: err8 } = await supabase
    .from("outfits")
    .select("id, title, rental_price")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .order("rental_price", { ascending: true })
    .limit(3);

  const isAscending =
    sortedAsc &&
    sortedAsc.length >= 2 &&
    sortedAsc[0].rental_price <= sortedAsc[1].rental_price;
  assert(!err8 && isAscending, "Sorting: Price Low to High", `Lowest: ₹${sortedAsc?.[0]?.rental_price}, Next: ₹${sortedAsc?.[1]?.rental_price}`);

  // 9. Sorting: Price High to Low
  const { data: sortedDesc, error: err9 } = await supabase
    .from("outfits")
    .select("id, title, rental_price")
    .eq("status", "published")
    .eq("verification_status", "approved")
    .order("rental_price", { ascending: false })
    .limit(3);

  const isDescending =
    sortedDesc &&
    sortedDesc.length >= 2 &&
    sortedDesc[0].rental_price >= sortedDesc[1].rental_price;
  assert(!err9 && isDescending, "Sorting: Price High to Low", `Highest: ₹${sortedDesc?.[0]?.rental_price}, Next: ₹${sortedDesc?.[1]?.rental_price}`);

  console.log("\n==========================================");
  console.log(`Summary: ${passes} PASS, ${fails} FAIL`);
  console.log("==========================================");

  if (fails > 0) {
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
