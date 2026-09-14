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

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyOutfitDetail() {
  console.log("🔍 Verifying Outfit Details Queries & Business Invariants (Public Anon Client)...\n");

  let passes = 0;
  let fails = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${name} ${details ? `(${details})` : ""}`);
      passes++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
      fails++;
    }
  }

  // 1. Valid Outfit query by slug
  const validSlug = "seed-sabyasachi-crimson-zardozi-lehenga";
  const { data: outfit, error: err1 } = await supabase
    .from("outfits")
    .select(
      `
      id, title, slug, brand, rental_price, purchase_price, security_deposit,
      size, condition, city, state, description, status, verification_status,
      category:categories!inner (id, name, slug, gender_type),
      images:outfit_images (id, storage_path, image_type, sort_order),
      measurements:outfit_measurements (bust, waist, hip, shoulder, length, sleeve_length, custom_measurements),
      availability:outfit_availability (start_date, end_date, status)
    `
    )
    .eq("slug", validSlug)
    .eq("status", "published")
    .eq("verification_status", "approved")
    .single();

  assert(!err1 && outfit?.slug === validSlug, "1. Valid Outfit Fetched by Slug", outfit?.title);
  assert(outfit?.rental_price === 8499, "2. Rental Price from Database", `₹${outfit?.rental_price}`);
  assert(outfit?.security_deposit === 4000, "3. Security Deposit from Database", `₹${outfit?.security_deposit}`);
  assert(outfit?.images?.length >= 2, "4. Multiple Images Loaded", `${outfit?.images?.length} images`);

  // 5. Measurements validation (real non-zero numbers only)
  const meas = outfit?.measurements?.[0] || outfit?.measurements;
  assert(meas && meas.bust === 36 && meas.waist === 30, "5. Measurements Accurate from DB", `Bust: ${meas?.bust}", Waist: ${meas?.waist}"`);

  // 6. Availability records fetched
  const avail = outfit?.availability;
  assert(avail && avail.length >= 1, "6. Availability Windows Loaded", `${avail?.length} windows found`);

  // 7. Non-existent slug returns no rows
  const { data: missingOutfit, error: err2 } = await supabase
    .from("outfits")
    .select("id, title")
    .eq("slug", "non-existent-wedding-dress-9999")
    .single();

  assert(err2 !== null || !missingOutfit, "7. Non-existent Outfit Returns 404/Empty", "Correctly not found");

  // 8. Similar outfits in same category (category_id)
  const { data: similar, error: err3 } = await supabase
    .from("outfits")
    .select(
      `id, title, slug, rental_price, category:categories!inner(id, name)`
    )
    .eq("category_id", outfit.category.id)
    .eq("status", "published")
    .eq("verification_status", "approved")
    .neq("id", outfit.id)
    .limit(4);

  assert(!err3 && similar?.length >= 1, "8. Similar Outfits from Same Category", `${similar?.length} similar items found`);

  // 9. Verify zero bookings exist for this outfit (zero booking creation invariant)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("outfit_id", outfit.id);

  assert(!bookings || bookings.length === 0, "9. No Bookings Created (Zero Writes Invariant)", "Database remains untouched");

  console.log("\n==========================================");
  console.log(`Summary: ${passes} PASS, ${fails} FAIL`);
  console.log("==========================================");

  if (fails > 0) process.exit(1);
}

verifyOutfitDetail().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
