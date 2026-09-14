import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("Missing supabaseUrl or secretKey in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("Checking categories...");
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug, gender_type")
    .order("name", { ascending: true });

  if (catErr) {
    console.error("Categories error:", catErr);
  } else {
    console.log(`Found ${categories.length} categories:`);
    console.log(
      categories.map((c) => `${c.slug} (${c.name}) [${c.id}]`).join("\n")
    );
  }

  console.log("\nChecking profiles...");
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name, role, email")
    .limit(10);

  if (profErr) {
    console.error("Profiles error:", profErr);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    console.log(profiles);
  }

  console.log("\nChecking auth users...");
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error("Auth users error:", userErr);
  } else {
    console.log(`Found ${users.users.length} auth users:`);
    console.log(users.users.map((u) => ({ id: u.id, email: u.email })));
  }
}

main().catch(console.error);
