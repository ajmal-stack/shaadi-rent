/**
 * ShaadiRent — Live Database Security Audit
 * Run with:  node --env-file=.env.local scripts/audit-database.mjs
 *
 * Tests:
 *   1. Table existence (admin client)
 *   2. Category seed data
 *   3. Anonymous (unauthenticated) access — RLS enforcement
 *   4. Attempt to write via anon — should be blocked
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

if (!URL || !ANON || !SECRET) {
  console.error("❌  Missing env vars. Ensure .env.local has all three Supabase keys.");
  process.exit(1);
}

// Admin client — bypasses RLS (uses secret/service-role key)
const admin = createClient(URL, SECRET);
// Anonymous client — no auth session, RLS fully applied
const anon  = createClient(URL, ANON);

let pass = 0;
let fail = 0;
const issues = [];

function ok(label) {
  console.log(`  ✅  ${label}`);
  pass++;
}
function bad(label, detail = "") {
  console.log(`  ❌  ${label}${detail ? ` — ${detail}` : ""}`);
  fail++;
  issues.push(`${label}${detail ? ": " + detail : ""}`);
}
function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ─────────────────────────────────────────────────────────────
// 1. TABLE EXISTENCE (admin client, bypasses RLS)
// ─────────────────────────────────────────────────────────────
section("1. TABLE EXISTENCE");

const EXPECTED_TABLES = [
  "profiles",
  "categories",
  "outfits",
  "outfit_images",
  "outfit_measurements",
  "outfit_availability",
  "bookings",
  "booking_status_history",
  "payments",
  "reviews",
  "disputes",
  "inspection_reports",
];

for (const table of EXPECTED_TABLES) {
  const { error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) {
    bad(`Table: ${table}`, error.message);
  } else {
    ok(`Table exists: ${table}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. CATEGORY SEED DATA
// ─────────────────────────────────────────────────────────────
section("2. CATEGORY SEED DATA");

const { data: cats, error: catErr } = await admin
  .from("categories")
  .select("name, slug, gender_type, is_active");

if (catErr) {
  bad("Failed to read categories", catErr.message);
} else {
  const bride = cats.filter(c => c.gender_type === "bride");
  const groom = cats.filter(c => c.gender_type === "groom");
  bride.length >= 5 ? ok(`Bride categories seeded (${bride.length})`) : bad("Bride categories", `expected ≥5, got ${bride.length}`);
  groom.length >= 7 ? ok(`Groom categories seeded (${groom.length})`) : bad("Groom categories", `expected ≥7, got ${groom.length}`);
  cats.every(c => c.is_active) ? ok("All seeded categories are active") : bad("Some categories are inactive");
}

// ─────────────────────────────────────────────────────────────
// 3. ANONYMOUS READ ACCESS — RLS enforcement
// ─────────────────────────────────────────────────────────────
section("3. ANONYMOUS READ ACCESS (unauthenticated)");

// Should ALLOW — active categories are public
const { data: anonCats, error: anonCatErr } = await anon.from("categories").select("*");
if (!anonCatErr && anonCats && anonCats.length > 0) {
  ok(`Categories readable by anon (${anonCats.length} active categories)`);
} else {
  bad("Categories should be readable by anon", anonCatErr?.message ?? "no data returned");
}

// Should ALLOW — only published+approved outfits (0 exist in clean DB, but no error)
const { data: anonOutfits, error: anonOutfitErr } = await anon.from("outfits").select("*");
if (!anonOutfitErr) {
  ok(`Outfits query succeeded for anon (${anonOutfits?.length ?? 0} published+approved rows — correct for empty DB)`);
} else {
  bad("Outfits query should not error for anon", anonOutfitErr.message);
}

// Should BLOCK — profiles are private
const { data: anonProfiles, error: anonProfileErr } = await anon.from("profiles").select("*");
if (!anonProfileErr && (!anonProfiles || anonProfiles.length === 0)) {
  ok("Profiles blocked for anon (empty result — RLS working)");
} else if (anonProfileErr) {
  ok(`Profiles blocked for anon (error returned — RLS working: ${anonProfileErr.message})`);
} else {
  bad("Profiles should be blocked for anon users", `returned ${anonProfiles?.length} rows`);
}

// Should BLOCK — bookings are private
const { data: anonBookings, error: anonBookErr } = await anon.from("bookings").select("*");
if (!anonBookErr && (!anonBookings || anonBookings.length === 0)) {
  ok("Bookings blocked for anon (empty — RLS working)");
} else if (anonBookErr) {
  ok(`Bookings blocked for anon (error — RLS working)`);
} else {
  bad("Bookings should be blocked for anon", `returned ${anonBookings?.length} rows`);
}

// Should BLOCK — payments are private
const { data: anonPayments, error: anonPayErr } = await anon.from("payments").select("*");
if (!anonPayErr && (!anonPayments || anonPayments.length === 0)) {
  ok("Payments blocked for anon (empty — RLS working)");
} else if (anonPayErr) {
  ok(`Payments blocked for anon (error — RLS working)`);
} else {
  bad("Payments should be blocked for anon", `returned ${anonPayments?.length} rows`);
}

// Should BLOCK — disputes are private
const { data: anonDisputes, error: anonDispErr } = await anon.from("disputes").select("*");
if (!anonDispErr && (!anonDisputes || anonDisputes.length === 0)) {
  ok("Disputes blocked for anon (empty — RLS working)");
} else if (anonDispErr) {
  ok(`Disputes blocked for anon (error — RLS working)`);
} else {
  bad("Disputes should be blocked for anon", `returned ${anonDisputes?.length} rows`);
}

// Should BLOCK — inspection_reports are private
const { data: anonInsp, error: anonInspErr } = await anon.from("inspection_reports").select("*");
if (!anonInspErr && (!anonInsp || anonInsp.length === 0)) {
  ok("Inspection reports blocked for anon (empty — RLS working)");
} else if (anonInspErr) {
  ok(`Inspection reports blocked for anon (error — RLS working)`);
} else {
  bad("Inspection reports should be blocked for anon", `returned ${anonInsp?.length} rows`);
}

// ─────────────────────────────────────────────────────────────
// 4. ANONYMOUS WRITE ATTEMPTS — all should fail
// ─────────────────────────────────────────────────────────────
section("4. ANONYMOUS WRITE ATTEMPTS (all should be blocked)");

// Try to INSERT a profile (should fail — no INSERT policy for anon)
const { error: insertProfileErr } = await anon
  .from("profiles")
  .insert({ id: "00000000-0000-0000-0000-000000000001", email: "hacker@test.com" });
if (insertProfileErr) {
  ok(`Profile INSERT blocked for anon (${insertProfileErr.code ?? insertProfileErr.message})`);
} else {
  bad("Profile INSERT should be blocked for anon — security hole!");
}

// Try to INSERT a category (should fail — only admins can write)
const { error: insertCatErr } = await anon
  .from("categories")
  .insert({ name: "Hack", slug: "hack", gender_type: "bride" });
if (insertCatErr) {
  ok(`Category INSERT blocked for anon (${insertCatErr.code ?? insertCatErr.message})`);
} else {
  bad("Category INSERT should be blocked for anon — security hole!");
}

// Try to INSERT a booking (should fail — anon has no booking policy)
const { error: insertBookErr } = await anon.from("bookings").insert({
  outfit_id: "00000000-0000-0000-0000-000000000001",
  renter_id: "00000000-0000-0000-0000-000000000001",
  owner_id:  "00000000-0000-0000-0000-000000000001",
  rental_start_date: "2026-10-01",
  rental_end_date:   "2026-10-03",
  rental_amount: 1000,
  total_amount:  1000,
});
if (insertBookErr) {
  ok(`Booking INSERT blocked for anon (${insertBookErr.code ?? insertBookErr.message})`);
} else {
  bad("Booking INSERT should be blocked for anon — security hole!");
}

// Try to INSERT a payment (should fail — no write policy for anon)
const { error: insertPayErr } = await anon.from("payments").insert({
  booking_id: "00000000-0000-0000-0000-000000000001",
  amount: 0,
});
if (insertPayErr) {
  ok(`Payment INSERT blocked for anon (${insertPayErr.code ?? insertPayErr.message})`);
} else {
  bad("Payment INSERT should be blocked for anon — security hole!");
}

// ─────────────────────────────────────────────────────────────
// 5. ADMIN CLIENT — verify admin can bypass RLS
// ─────────────────────────────────────────────────────────────
section("5. ADMIN ACCESS (service role — bypasses RLS)");

const { data: adminProfiles, error: adminProfileErr } = await admin
  .from("profiles")
  .select("*", { count: "exact", head: true });
if (!adminProfileErr) {
  ok("Admin client can access profiles table (RLS bypassed via service role)");
} else {
  bad("Admin client cannot access profiles", adminProfileErr.message);
}

const { data: adminCats, error: adminCatsErr } = await admin
  .from("categories")
  .select("*", { count: "exact", head: true });
if (!adminCatsErr) {
  ok("Admin client can access categories table");
} else {
  bad("Admin client cannot access categories", adminCatsErr.message);
}

// ─────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log("  AUDIT SUMMARY");
console.log("═".repeat(60));
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);

if (issues.length > 0) {
  console.log("\n  Issues found:");
  issues.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`));
  console.log();
  process.exit(1);
} else {
  console.log("\n  ✅  All checks passed.\n");
  process.exit(0);
}
