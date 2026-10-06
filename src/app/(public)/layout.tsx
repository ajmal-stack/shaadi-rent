import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Public routes layout — wraps all (public) pages with the site Header and Footer.
 * The flex-col / flex-1 pattern ensures the footer is always pinned to the bottom
 * of the viewport, even when the page content is zero-height (e.g., during
 * Next.js App Router streaming / Suspense loading states).
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col w-full min-h-dvh">
      <Header />
      <main className="flex-1 flex flex-col w-full">{children}</main>
      <Footer />
    </div>
  );
}
