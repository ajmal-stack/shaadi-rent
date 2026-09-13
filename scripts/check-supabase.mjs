/**
 * Dev utility — checks Supabase connectivity using the official JS client.
 * Run with:  node --env-file=.env.local scripts/check-supabase.mjs
 *
 * Compatible with Node.js 20 (polyfills WebSocket via 'ws' package).
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

// Polyfill WebSocket for Node.js < 22
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("\n🔍 ShaadiRent — Supabase Connection Check\n");

if (!url || !key) {
  console.error("❌  Missing credentials.\n");
  if (!url) console.error("   • NEXT_PUBLIC_SUPABASE_URL is not set.");
  if (!key) console.error("   • NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
  process.exit(1);
}

console.log(`   URL  : ${url}`);
console.log(`   Key  : ${key.slice(0, 24)}… (truncated for safety)\n`);

try {
  const supabase = createClient(url, key);

  // getSession() — lightweight auth call, no DB table required
  const { error } = await supabase.auth.getSession();

  if (!error) {
    console.log("✅  Supabase is connected! Auth session call succeeded.\n");
    process.exit(0);
  } else {
    console.error(`❌  Supabase auth error: ${error.message}\n`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌  Could not connect to Supabase: ${err.message}\n`);
  process.exit(1);
}
