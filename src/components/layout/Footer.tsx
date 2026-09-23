"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Heart } from "lucide-react";

export function Footer({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  // 1. Hide completely on authentication flows (centered standalone card)
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  // 2. Hide on mobile for listing creation wizard flows
  const isListingWizard = pathname?.startsWith("/list-your-outfit");
  const wizardMobileClass = isListingWizard ? "hidden md:block" : "";

  return (
    <footer
      className={`border-t border-rose-100 bg-stone-950 text-stone-300 pt-12 sm:pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-12 mt-auto ${wizardMobileClass} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-stone-800/80">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 to-rose-900 text-base shadow-sm ring-1 ring-amber-400/40">
                💍
              </span>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                ShaadiRent
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm leading-relaxed">
              India&apos;s premier wedding fashion rental marketplace. Wear authentic designer bridal &amp; groom couture at a fraction of retail price.
            </p>
            <p className="text-xs text-amber-300/90 font-medium italic">
              Rent. Wear. Return.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-stone-400">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>100% Insured &amp; Sanitized Guarantee</span>
            </div>
          </div>

          {/* Links Grid: 2-column on mobile, 3-column on lg screens */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Col 1: Categories */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Collections
              </p>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <Link href="/browse?category=lehengas" className="hover:text-white transition-colors">
                    Bridal Lehengas
                  </Link>
                </li>
                <li>
                  <Link href="/browse?category=sherwanis" className="hover:text-white transition-colors">
                    Groom Sherwanis
                  </Link>
                </li>
                <li>
                  <Link href="/browse?category=gowns" className="hover:text-white transition-colors">
                    Reception Gowns
                  </Link>
                </li>
                <li>
                  <Link href="/browse?category=haldi" className="hover:text-white transition-colors">
                    Haldi &amp; Mehendi
                  </Link>
                </li>
                <li>
                  <Link href="/browse?category=jewellery" className="hover:text-white transition-colors">
                    Heritage Jewellery
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: For Lenders & Couples */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Explore
              </p>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/rent-your-outfit" className="hover:text-white transition-colors">
                    Rent Your Outfit
                  </Link>
                </li>
                <li>
                  <Link href="/bookings" className="hover:text-white transition-colors">
                    Track Bookings
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-white transition-colors">
                    My Closet
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-white transition-colors">
                    Owner Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: City Hubs */}
            <div className="col-span-2 md:col-span-1 space-y-3 pt-2 sm:pt-0">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Hub Cities
              </p>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li>Delhi NCR · Gurugram · Noida</li>
                <li>Mumbai · Thane · Navi Mumbai</li>
                <li>Bengaluru · Hyderabad</li>
                <li>Jaipur · Udaipur · Jodhpur</li>
                <li>Chandigarh · Lucknow</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Tagline with mobile clearance */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-stone-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} ShaadiRent Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1">
            Crafted with <Heart size={12} className="text-rose-600 fill-rose-600 shrink-0" /> for unforgettable Indian weddings
          </p>
        </div>
      </div>
    </footer>
  );
}
