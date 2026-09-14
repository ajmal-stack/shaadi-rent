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

async function clearSeedData() {
  console.log("🧹 Cleaning up ShaadiRent development seed data...");

  // 1. Delete seed outfits (cascading deletes outfit_images, outfit_measurements, outfit_availability)
  const { data: deletedOutfits, error: delErr } = await admin
    .from("outfits")
    .delete()
    .like("slug", "seed-%")
    .select("id, title, slug");

  if (delErr) {
    console.error("❌ Error deleting seed outfits:", delErr.message);
    process.exit(1);
  }

  const count = deletedOutfits?.length ?? 0;
  console.log(`✅ Deleted ${count} seed outfits and all cascaded child records (images, measurements, availability).`);

  // 2. Check for seed user
  const { data: usersData } = await admin.auth.admin.listUsers();
  const seedUser = usersData?.users?.find(
    (u) => u.email === "seed.inventory@shaadirent.internal"
  );

  if (seedUser) {
    const { error: userDelErr } = await admin.auth.admin.deleteUser(seedUser.id);
    if (userDelErr) {
      console.warn("⚠️ Note: Could not delete seed auth user:", userDelErr.message);
    } else {
      console.log(`✅ Removed seed owner auth user (${seedUser.id}).`);
    }
  }

  console.log("🎉 Seed cleanup complete. Database is restored to clean state.");
}

clearSeedData().catch((err) => {
  console.error("Unexpected cleanup error:", err);
  process.exit(1);
});
