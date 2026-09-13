import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer route group layout — runs before every page inside (customer)/.
 *
 * Guard: Any authenticated user may access customer routes.
 * Unauthenticated users are redirected to /auth/login.
 *
 * This is the SECOND line of defence (proxy.ts is the first).
 * Keeping both means the page is never rendered for unauthenticated users
 * even if the middleware is misconfigured or bypassed.
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Always use getUser() — validates the JWT with Supabase, not just the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
