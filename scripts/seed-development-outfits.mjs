import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment");
  process.exit(1);
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("🌱 Starting ShaadiRent Development Seed Insertion...\n");

  // 1. Fetch Categories map (slug -> category record)
  const { data: categories, error: catErr } = await admin
    .from("categories")
    .select("id, name, slug, gender_type");

  if (catErr || !categories || categories.length === 0) {
    console.error("❌ Failed to fetch categories:", catErr?.message);
    process.exit(1);
  }

  const catMap = new Map(categories.map((c) => [c.slug, c]));
  console.log(`✅ Loaded ${categories.length} database categories.`);

  // 2. Ensure Seed Owner Profile exists
  const seedEmail = "seed.inventory@shaadirent.internal";
  let ownerId = null;

  const { data: usersData } = await admin.auth.admin.listUsers();
  let seedUser = usersData?.users?.find((u) => u.email === seedEmail);

  if (!seedUser) {
    console.log("Creating seed inventory owner in auth.users...");
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: seedEmail,
      password: "SeedPassword@2026!DoNotUseInProd",
      email_confirm: true,
      user_metadata: {
        full_name: "ShaadiRent Heritage Vault",
      },
    });

    if (createErr || !newUser.user) {
      console.error("❌ Failed to create seed owner:", createErr?.message);
      process.exit(1);
    }
    seedUser = newUser.user;
    console.log(`✅ Created seed auth user: ${seedUser.id}`);
  } else {
    console.log(`✅ Reusing existing seed auth user: ${seedUser.id}`);
  }

  ownerId = seedUser.id;

  // Verify profile exists in public.profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", ownerId)
    .single();

  if (!profile) {
    console.log("Creating public.profiles entry for seed user...");
    await admin.from("profiles").insert({
      id: ownerId,
      full_name: "ShaadiRent Heritage Vault",
      email: seedEmail,
      role: "owner",
    });
  }

  // 3. Idempotent cleanup of existing seed outfits
  console.log("\n🧹 Removing any prior seed outfits (slug LIKE 'seed-%')...");
  const { data: removed } = await admin
    .from("outfits")
    .delete()
    .like("slug", "seed-%")
    .select("id");
  console.log(`Removed ${removed?.length ?? 0} prior seed records.`);

  // 4. Define 16 high-fidelity sample wedding outfits
  const sampleOutfits = [
    // ── Bridal Lehengas ──
    {
      categorySlug: "bridal-lehenga",
      title: "Sabyasachi Crimson Zardozi Heritage Velvet Lehenga",
      slug: "seed-sabyasachi-crimson-zardozi-lehenga",
      brand: "Sabyasachi",
      purchase_price: 185000,
      rental_price: 8499,
      security_deposit: 4000,
      size: "M",
      condition: "like_new",
      color: "Crimson Red",
      city: "Delhi NCR",
      district: "South Delhi",
      state: "Delhi",
      description:
        "[DEVELOPMENT SEED INVENTORY] An exquisite royal crimson bridal lehenga handcrafted in pure velvet with intricate zardozi, dabka, and tilla embroidery. Features dual dupattas (organza veil and velvet shoulder drape) with hand-cut scalloped borders. Professionally sanitized and stored in climate-controlled conditions.",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
        { path: "/images/hero_wedding_couple.jpg", type: "detail", order: 1 },
      ],
      measurements: {
        bust: 36,
        waist: 30,
        hip: 39,
        shoulder: 14.5,
        length: 42.5,
        sleeve_length: 11,
        custom: { alteration_margin_inches: 2, blouse_padding: true },
      },
      availability: [
        { start: "2026-10-01", end: "2026-10-06", status: "available" },
        { start: "2026-10-15", end: "2026-10-20", status: "available" },
      ],
    },
    {
      categorySlug: "bridal-lehenga",
      title: "Manish Malhotra Rose Gold Sequined Organza Lehenga",
      slug: "seed-manish-malhotra-rose-gold-sequin-lehenga",
      brand: "Manish Malhotra",
      purchase_price: 145000,
      rental_price: 6999,
      security_deposit: 3500,
      size: "S",
      condition: "excellent",
      color: "Rose Gold",
      city: "Mumbai",
      district: "Bandra West",
      state: "Maharashtra",
      description:
        "[DEVELOPMENT SEED INVENTORY] Dazzling pastel rose gold bridal lehenga with tone-on-tone metallic sequins and Swarovski crystal embellishments on featherlight organza. Includes a sculpted sweetheart blouse and trailing sheer veil.",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 34,
        waist: 28,
        hip: 37,
        shoulder: 14,
        length: 41.5,
        sleeve_length: 10.5,
        custom: { alteration_margin_inches: 1.5 },
      },
      availability: [
        { start: "2026-10-05", end: "2026-10-12", status: "available" },
      ],
    },
    {
      categorySlug: "bridal-lehenga",
      title: "Anita Dongre Emerald Green Gota Patti Silk Lehenga",
      slug: "seed-anita-dongre-emerald-gota-patti-lehenga",
      brand: "Anita Dongre",
      purchase_price: 95000,
      rental_price: 4999,
      security_deposit: 2500,
      size: "L",
      condition: "like_new",
      color: "Emerald Green",
      city: "Jaipur",
      district: "C-Scheme",
      state: "Rajasthan",
      description:
        "[DEVELOPMENT SEED INVENTORY] Forest emerald raw silk lehenga featuring signature Rajasthani gota patti and dori work with floral motifs. Breathable lightweight lining ideal for autumn and winter weddings.",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 38,
        waist: 32,
        hip: 41,
        shoulder: 15,
        length: 43,
        sleeve_length: 11.5,
        custom: { alteration_margin_inches: 2 },
      },
      availability: [
        { start: "2026-10-10", end: "2026-10-18", status: "available" },
      ],
    },

    // ── Groom Sherwanis ──
    {
      categorySlug: "sherwani",
      title: "Tarun Tahiliani Regal Ivory Raw Silk Jamdani Sherwani",
      slug: "seed-tarun-tahiliani-regal-ivory-sherwani",
      brand: "Tarun Tahiliani",
      purchase_price: 120000,
      rental_price: 5999,
      security_deposit: 3000,
      size: "L",
      condition: "like_new",
      color: "Ivory White",
      city: "Delhi NCR",
      district: "Mehrauli",
      state: "Delhi",
      description:
        "[DEVELOPMENT SEED INVENTORY] Sovereign ivory raw silk sherwani adorned with handcrafted Kashmiri aari work and subtle pearl detailing along the high mandarin collar. Accompanied by silk churidar and a coordinated georgette stole.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
        { path: "/images/hero_wedding_couple.jpg", type: "detail", order: 1 },
      ],
      measurements: {
        bust: 40,
        waist: 34,
        hip: 40,
        shoulder: 18,
        length: 44,
        sleeve_length: 25.5,
        custom: { chest_inches: 40 },
      },
      availability: [
        { start: "2026-10-01", end: "2026-10-10", status: "available" },
      ],
    },
    {
      categorySlug: "sherwani",
      title: "Manish Malhotra Midnight Blue Velvet Embroidered Bandhgala",
      slug: "seed-manish-malhotra-midnight-blue-bandhgala",
      brand: "Manish Malhotra",
      purchase_price: 85000,
      rental_price: 4499,
      security_deposit: 2500,
      size: "M",
      condition: "excellent",
      color: "Midnight Blue",
      city: "Bengaluru",
      district: "Indiranagar",
      state: "Karnataka",
      description:
        "[DEVELOPMENT SEED INVENTORY] Sharp midnight velvet bandhgala jacket tailored with metallic bullion embroidery and custom crested brass buttons. Pairs effortlessly with tapered silk trousers for sangeet or reception.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 38,
        waist: 32,
        hip: 39,
        shoulder: 17.5,
        length: 42,
        sleeve_length: 25,
        custom: { chest_inches: 38 },
      },
      availability: [
        { start: "2026-10-08", end: "2026-10-16", status: "available" },
      ],
    },
    {
      categorySlug: "sherwani",
      title: "Manyavar Royal Champagne Antique Zari Sherwani",
      slug: "seed-manyavar-champagne-antique-zari-sherwani",
      brand: "Manyavar",
      purchase_price: 48000,
      rental_price: 2999,
      security_deposit: 1500,
      size: "XL",
      condition: "like_new",
      color: "Champagne Gold",
      city: "Chandigarh",
      district: "Sector 17",
      state: "Punjab",
      description:
        "[DEVELOPMENT SEED INVENTORY] Classic wedding sherwani in warm champagne brocade with fine resham embroidery. Comes with matching pocket square and contrast maroon stole.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 42,
        waist: 36,
        hip: 42,
        shoulder: 18.5,
        length: 45,
        sleeve_length: 26,
        custom: { chest_inches: 42 },
      },
      availability: [
        { start: "2026-10-12", end: "2026-10-22", status: "available" },
      ],
    },

    // ── Sarees ──
    {
      categorySlug: "saree",
      title: "Raw Mango Crimson Handloom Kanjeevaram Silk Saree",
      slug: "seed-raw-mango-crimson-kanjeevaram-saree",
      brand: "Raw Mango",
      purchase_price: 62000,
      rental_price: 3499,
      security_deposit: 2000,
      size: "Free Size",
      condition: "like_new",
      color: "Crimson Red",
      city: "Bengaluru",
      district: "Koramangala",
      state: "Karnataka",
      description:
        "[DEVELOPMENT SEED INVENTORY] Authentic mulberry silk Kanjeevaram saree handwoven in Varanasi with solid real zari temple borders and mayil (peacock) pallu motifs. Includes unstitched/stitched designer blouse (Size 36 with 2-inch margin).",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 36,
        waist: 30,
        hip: 38,
        shoulder: 14,
        length: 42,
        sleeve_length: 10,
        custom: { saree_length_meters: 6.2 },
      },
      availability: [
        { start: "2026-10-02", end: "2026-10-08", status: "available" },
      ],
    },
    {
      categorySlug: "saree",
      title: "Ekaya Banaras Handwoven Gold Tissue Georgette Saree",
      slug: "seed-ekaya-gold-tissue-banarasi-saree",
      brand: "Ekaya Banaras",
      purchase_price: 55000,
      rental_price: 2799,
      security_deposit: 1500,
      size: "Free Size",
      condition: "excellent",
      color: "Antique Gold",
      city: "Hyderabad",
      district: "Jubilee Hills",
      state: "Telangana",
      description:
        "[DEVELOPMENT SEED INVENTORY] Shimmering gold tissue Banarasi georgette drape crafted with intricate kadhwa technique and floral jaal. Fluid drape with royal sheen for reception or wedding evening.",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 35,
        waist: 29,
        hip: 38,
        shoulder: 14,
        length: 42,
        sleeve_length: 10.5,
        custom: { saree_length_meters: 5.8 },
      },
      availability: [
        { start: "2026-10-04", end: "2026-10-15", status: "available" },
      ],
    },

    // ── Gowns ──
    {
      categorySlug: "gown",
      title: "Gaurav Gupta Sculpted Emerald Sequined Cape Gown",
      slug: "seed-gaurav-gupta-sculpted-emerald-cape-gown",
      brand: "Gaurav Gupta",
      purchase_price: 110000,
      rental_price: 5499,
      security_deposit: 3000,
      size: "S",
      condition: "like_new",
      color: "Emerald Green",
      city: "Mumbai",
      district: "Colaba",
      state: "Maharashtra",
      description:
        "[DEVELOPMENT SEED INVENTORY] Avant-garde structured couture gown with architectural 3D wire drape across the shoulder and cascading sequined trail. Designed for black-tie sangeet or reception galas.",
      images: [
        { path: "/images/reception_gown.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 34,
        waist: 27,
        hip: 36,
        shoulder: 14,
        length: 58,
        sleeve_length: 23,
        custom: { trail_length_inches: 18 },
      },
      availability: [
        { start: "2026-10-03", end: "2026-10-10", status: "available" },
      ],
    },
    {
      categorySlug: "gown",
      title: "Falguni Shane Peacock Metallic Stardust Trail Gown",
      slug: "seed-falguni-shane-peacock-stardust-trail-gown",
      brand: "Falguni Shane Peacock",
      purchase_price: 135000,
      rental_price: 6299,
      security_deposit: 3500,
      size: "M",
      condition: "like_new",
      color: "Silver Mist",
      city: "Delhi NCR",
      district: "Vasant Kunj",
      state: "Delhi",
      description:
        "[DEVELOPMENT SEED INVENTORY] Breathtaking silver and champagne cocktail gown embroidered with delicate micro-sequins, acrylic mirrors, and ostrich feather accents along the mermaid hemline.",
      images: [
        { path: "/images/reception_gown.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 36,
        waist: 29,
        hip: 38,
        shoulder: 14.5,
        length: 59,
        sleeve_length: 24,
        custom: { trail_length_inches: 22 },
      },
      availability: [
        { start: "2026-10-09", end: "2026-10-18", status: "available" },
      ],
    },

    // ── Indo-Western ──
    {
      categorySlug: "indo-western",
      title: "Shantnu & Nikhil Charcoal Drape Achkan Kurta Set",
      slug: "seed-shantnu-nikhil-charcoal-drape-achkan-set",
      brand: "Shantnu & Nikhil",
      purchase_price: 58000,
      rental_price: 3199,
      security_deposit: 1800,
      size: "M",
      condition: "excellent",
      color: "Charcoal Grey",
      city: "Delhi NCR",
      district: "Chanakyapuri",
      state: "Delhi",
      description:
        "[DEVELOPMENT SEED INVENTORY] Neo-Indian military drape jacket paired with an asymmetric flared inner kurta and fitted breeches. Finished with metallic crest pins and leatherette epaulettes.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 39,
        waist: 33,
        hip: 39,
        shoulder: 17.5,
        length: 43,
        sleeve_length: 25,
        custom: { chest_inches: 39 },
      },
      availability: [
        { start: "2026-10-01", end: "2026-10-14", status: "available" },
      ],
    },
    {
      categorySlug: "indo-western",
      title: "Rohit Bal Ivory Asymmetric Draped Sherwani Jacket",
      slug: "seed-rohit-bal-ivory-asymmetric-draped-jacket",
      brand: "Rohit Bal",
      purchase_price: 72000,
      rental_price: 3899,
      security_deposit: 2000,
      size: "L",
      condition: "like_new",
      color: "Ivory & Black",
      city: "Jaipur",
      district: "Johari Bazaar",
      state: "Rajasthan",
      description:
        "[DEVELOPMENT SEED INVENTORY] Signature Rohit Bal flared asymmetric jacket featuring lotus and peacock hand-block prints in antique gold with contrast velvet facings.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 41,
        waist: 35,
        hip: 41,
        shoulder: 18,
        length: 44,
        sleeve_length: 25.5,
        custom: { chest_inches: 41 },
      },
      availability: [
        { start: "2026-10-15", end: "2026-10-25", status: "available" },
      ],
    },

    // ── Anarkali / Mehendi ──
    {
      categorySlug: "anarkali",
      title: "Torani Mustard Yellow Chanderi Mirror-Work Anarkali",
      slug: "seed-torani-mustard-yellow-mirror-anarkali",
      brand: "Torani",
      purchase_price: 46000,
      rental_price: 2499,
      security_deposit: 1500,
      size: "M",
      condition: "like_new",
      color: "Mustard Yellow",
      city: "Jaipur",
      district: "Mansarovar",
      state: "Rajasthan",
      description:
        "[DEVELOPMENT SEED INVENTORY] Cheerful marigold yellow 32-kali Chanderi silk anarkali with mirror embroidery and scalloped organza dupatta. Ideal for Haldi, Mehendi, and joyous morning pheras.",
      images: [
        { path: "/images/haldi_outfit.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 36,
        waist: 30,
        hip: 40,
        shoulder: 14.5,
        length: 52,
        sleeve_length: 20,
        custom: { kalis_count: 32 },
      },
      availability: [
        { start: "2026-10-01", end: "2026-10-10", status: "available" },
      ],
    },

    // ── Tuxedo ──
    {
      categorySlug: "tuxedo",
      title: "Raymond Bespoke Italian Wool Satin Shawl-Lapel Tuxedo",
      slug: "seed-raymond-bespoke-shawl-lapel-tuxedo",
      brand: "Raymond Made-to-Measure",
      purchase_price: 42000,
      rental_price: 2899,
      security_deposit: 1500,
      size: "L",
      condition: "excellent",
      color: "Midnight Black",
      city: "Mumbai",
      district: "Lower Parel",
      state: "Maharashtra",
      description:
        "[DEVELOPMENT SEED INVENTORY] Two-piece luxury tuxedo made from Super 130s Italian wool with satin shawl lapels and matching side-stripe trousers. A refined essential for wedding receptions and black-tie dinners.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: {
        bust: 40,
        waist: 34,
        hip: 40,
        shoulder: 18,
        length: 30,
        sleeve_length: 25.5,
        custom: { chest_inches: 40 },
      },
      availability: [
        { start: "2026-10-06", end: "2026-10-18", status: "available" },
      ],
    },

    // ── Bridal Accessories ──
    {
      categorySlug: "bridal-accessories",
      title: "Tanishq Rivaah Heritage 22K Gold Polki Choker & Matha Patti Set",
      slug: "seed-tanishq-heritage-gold-polki-choker-set",
      brand: "Tanishq Rivaah",
      purchase_price: 150000,
      rental_price: 3999,
      security_deposit: 5000,
      size: "Free Size",
      condition: "like_new",
      color: "Gold & Kundan",
      city: "Delhi NCR",
      district: "Karol Bagh",
      state: "Delhi",
      description:
        "[DEVELOPMENT SEED INVENTORY] Royal bridal jewellery set featuring a multi-strand uncut Polki diamond choker, matching chandelier jhumkis, matha patti, and nath. Gold vermeil finish with emerald drop beads.",
      images: [
        { path: "/images/bridal_lehenga.jpg", type: "front", order: 0 },
      ],
      measurements: null,
      availability: [
        { start: "2026-10-01", end: "2026-10-20", status: "available" },
      ],
    },

    // ── Groom Accessories ──
    {
      categorySlug: "groom-accessories",
      title: "Royal Chanderi Silk Safa with Kundan Kalgi & Pearl Mala Set",
      slug: "seed-royal-chanderi-safa-kalgi-mala-set",
      brand: "Heritage Safa House",
      purchase_price: 28000,
      rental_price: 1499,
      security_deposit: 1000,
      size: "Free Size",
      condition: "like_new",
      color: "Blush Peach & Pearl",
      city: "Jaipur",
      district: "Johari Bazaar",
      state: "Rajasthan",
      description:
        "[DEVELOPMENT SEED INVENTORY] Complete groom accessories suite including pre-tied Chanderi silk safa (turban), green enamel kundan kalgi feather brooch, and 5-strand Basra pearl necklace.",
      images: [
        { path: "/images/groom_sherwani.jpg", type: "front", order: 0 },
      ],
      measurements: null,
      availability: [
        { start: "2026-10-01", end: "2026-10-25", status: "available" },
      ],
    },
  ];

  console.log(`\n📦 Inserting ${sampleOutfits.length} sample outfits into Supabase...`);

  let outfitsInserted = 0;
  let imagesInserted = 0;
  let measurementsInserted = 0;
  let availabilityInserted = 0;

  for (const item of sampleOutfits) {
    const category = catMap.get(item.categorySlug);
    if (!category) {
      console.warn(`⚠️ Warning: Category '${item.categorySlug}' not found in database. Skipping.`);
      continue;
    }

    // 1. Insert Outfit
    const { data: outfit, error: outfitErr } = await admin
      .from("outfits")
      .insert({
        owner_id: ownerId,
        category_id: category.id,
        title: item.title,
        slug: item.slug,
        brand: item.brand,
        purchase_price: item.purchase_price,
        rental_price: item.rental_price,
        security_deposit: item.security_deposit,
        size: item.size,
        condition: item.condition,
        color: item.color,
        status: "published",
        verification_status: "approved",
        city: item.city,
        district: item.district,
        state: item.state,
        description: item.description,
      })
      .select("id, title, slug")
      .single();

    if (outfitErr || !outfit) {
      console.error(`❌ Error inserting outfit "${item.title}":`, outfitErr?.message);
      continue;
    }

    outfitsInserted++;

    // 2. Insert Images
    if (item.images && item.images.length > 0) {
      const imageRows = item.images.map((img) => ({
        outfit_id: outfit.id,
        storage_path: img.path,
        image_type: img.type,
        sort_order: img.order,
      }));

      const { error: imgErr } = await admin.from("outfit_images").insert(imageRows);
      if (imgErr) {
        console.warn(`⚠️ Image insert error for ${outfit.title}:`, imgErr.message);
      } else {
        imagesInserted += imageRows.length;
      }
    }

    // 3. Insert Measurements (if applicable)
    if (item.measurements) {
      const { error: measErr } = await admin.from("outfit_measurements").insert({
        outfit_id: outfit.id,
        bust: item.measurements.bust,
        waist: item.measurements.waist,
        hip: item.measurements.hip,
        shoulder: item.measurements.shoulder,
        length: item.measurements.length,
        sleeve_length: item.measurements.sleeve_length,
        custom_measurements: item.measurements.custom ?? null,
      });

      if (measErr) {
        console.warn(`⚠️ Measurement insert error for ${outfit.title}:`, measErr.message);
      } else {
        measurementsInserted++;
      }
    }

    // 4. Insert Availability
    if (item.availability && item.availability.length > 0) {
      const availRows = item.availability.map((avail) => ({
        outfit_id: outfit.id,
        start_date: avail.start,
        end_date: avail.end,
        status: avail.status,
      }));

      const { error: availErr } = await admin.from("outfit_availability").insert(availRows);
      if (availErr) {
        console.warn(`⚠️ Availability insert error for ${outfit.title}:`, availErr.message);
      } else {
        availabilityInserted += availRows.length;
      }
    }
  }

  console.log("\n==========================================");
  console.log("🎉 Seed Data Insertion Completed Successfully!");
  console.log("==========================================");
  console.log(`- Outfits created:       ${outfitsInserted} rows`);
  console.log(`- Images created:        ${imagesInserted} rows`);
  console.log(`- Measurements created:  ${measurementsInserted} rows`);
  console.log(`- Availability windows:  ${availabilityInserted} rows`);
  console.log(`- Owner profile:         ${ownerId} (ShaadiRent Heritage Vault)`);
  console.log("\nTo remove all seed data at any time, run:");
  console.log("node --env-file=.env.local scripts/clear-seed-data.mjs");
}

seed().catch((err) => {
  console.error("❌ Fatal seed execution error:", err);
  process.exit(1);
});
