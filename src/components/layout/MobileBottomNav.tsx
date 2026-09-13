"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, HelpCircle, Plus, Calendar, User } from "lucide-react";
import { AuthUser } from "./MobileMenu";

interface MobileBottomNavProps {
  user: AuthUser | null;
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isBrowseActive = pathname.startsWith("/browse");
  const isHowItWorksActive = pathname.startsWith("/how-it-works");
  const isRentOutfitActive = pathname.startsWith("/rent-your-outfit");
  const isBookingsActive = pathname.startsWith("/bookings");
  const isAccountActive =
    pathname.startsWith("/account") || pathname.startsWith("/auth");

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-rose-100/90 bg-white/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {/* 1. Browse Outfits */}
        <Link
          href="/browse"
          className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
            isBrowseActive ? "text-rose-900" : "text-gray-500 hover:text-rose-700"
          }`}
        >
          <div className="relative">
            <Sparkles
              size={20}
              strokeWidth={isBrowseActive ? 2.4 : 1.9}
              className={`transition-colors ${
                isBrowseActive ? "text-rose-800" : "text-gray-500"
              }`}
            />
            {isBrowseActive && (
              <span className="absolute -top-1 right-[-4px] h-1.5 w-1.5 rounded-full bg-rose-700 ring-2 ring-white" />
            )}
          </div>
          <span
            className={`mt-1 text-[11px] tracking-tight ${
              isBrowseActive ? "font-bold text-rose-900" : "font-medium"
            }`}
          >
            Browse
          </span>
        </Link>

        {/* 2. How It Works */}
        <Link
          href="/how-it-works"
          className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
            isHowItWorksActive
              ? "text-rose-900"
              : "text-gray-500 hover:text-rose-700"
          }`}
        >
          <div className="relative">
            <HelpCircle
              size={20}
              strokeWidth={isHowItWorksActive ? 2.4 : 1.9}
              className={`transition-colors ${
                isHowItWorksActive ? "text-rose-800" : "text-gray-500"
              }`}
            />
            {isHowItWorksActive && (
              <span className="absolute -top-1 right-[-4px] h-1.5 w-1.5 rounded-full bg-rose-700 ring-2 ring-white" />
            )}
          </div>
          <span
            className={`mt-1 text-[11px] tracking-tight ${
              isHowItWorksActive ? "font-bold text-rose-900" : "font-medium"
            }`}
          >
            Guide
          </span>
        </Link>

        {/* 3. Rent Your Outfit (Prominent elevated center action) */}
        <Link
          href="/rent-your-outfit"
          className="group relative -top-3.5 flex flex-col items-center justify-center transition-transform duration-150 active:scale-95"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
              isRentOutfitActive
                ? "bg-gradient-to-tr from-rose-800 via-rose-900 to-amber-700 ring-4 ring-rose-200"
                : "bg-gradient-to-tr from-rose-700 via-rose-800 to-amber-600 ring-4 ring-white shadow-rose-900/25"
            }`}
          >
            <Plus size={24} className="text-white" strokeWidth={2.6} />
          </div>
          <span className="mt-0.5 text-[10px] font-bold text-rose-950 tracking-tight">
            Rent Outfit
          </span>
        </Link>

        {/* 4. My Bookings */}
        <Link
          href={user ? "/bookings" : "/auth/login?next=/bookings"}
          className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
            isBookingsActive ? "text-rose-900" : "text-gray-500 hover:text-rose-700"
          }`}
        >
          <div className="relative">
            <Calendar
              size={20}
              strokeWidth={isBookingsActive ? 2.4 : 1.9}
              className={`transition-colors ${
                isBookingsActive ? "text-rose-800" : "text-gray-500"
              }`}
            />
            {isBookingsActive && (
              <span className="absolute -top-1 right-[-4px] h-1.5 w-1.5 rounded-full bg-rose-700 ring-2 ring-white" />
            )}
          </div>
          <span
            className={`mt-1 text-[11px] tracking-tight ${
              isBookingsActive ? "font-bold text-rose-900" : "font-medium"
            }`}
          >
            Bookings
          </span>
        </Link>

        {/* 5. Account / Login */}
        <Link
          href={user ? "/account" : "/auth/login"}
          className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
            isAccountActive ? "text-rose-900" : "text-gray-500 hover:text-rose-700"
          }`}
        >
          <div className="relative">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={22}
                height={22}
                className="rounded-full ring-2 ring-rose-400 object-cover"
              />
            ) : user ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-[10px] font-bold text-white shadow-xs">
                {initials}
              </div>
            ) : (
              <User
                size={20}
                strokeWidth={isAccountActive ? 2.4 : 1.9}
                className={`transition-colors ${
                  isAccountActive ? "text-rose-800" : "text-gray-500"
                }`}
              />
            )}
            {isAccountActive && (
              <span className="absolute -top-1 right-[-4px] h-1.5 w-1.5 rounded-full bg-rose-700 ring-2 ring-white" />
            )}
          </div>
          <span
            className={`mt-1 text-[11px] tracking-tight ${
              isAccountActive ? "font-bold text-rose-900" : "font-medium"
            }`}
          >
            {user ? "Account" : "Login"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
