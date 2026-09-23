import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

  return (
    <div className="flex flex-col min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer className="mt-auto hidden md:block" />
    </div>
  );
}
