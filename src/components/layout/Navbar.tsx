"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Calendar,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { AuthUser } from "./MobileMenu";
import { SearchModal } from "./SearchModal";
import { MobileBottomNav } from "./MobileBottomNav";
import { signOut } from "@/app/(public)/auth/actions";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘K / Ctrl+K) to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-rose-100/80 bg-white/95 backdrop-blur-md shadow-xs transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* =========================================================================
              DESKTOP NAVBAR (Hidden on mobile, visible on md and above)
              Left: ShaadiRent | Browse Outfits | How It Works | Rent Your Outfit
              Right: Search | My Bookings | Account/Login
             ========================================================================= */}
          <div className="hidden md:flex h-18 items-center justify-between">
            {/* ── DESKTOP LEFT ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-8">
              {/* Brand Logo */}
              <Link
                href="/"
                className="group flex items-center gap-2.5 focus:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 text-base shadow-sm ring-1 ring-amber-300/40 transition-transform duration-200 group-hover:scale-105"
                >
                  💍
                </span>
                <span className="font-display text-2xl font-bold tracking-tight text-rose-950 transition-colors group-hover:text-rose-800">
                  ShaadiRent
                </span>
              </Link>

              {/* Vertical divider */}
              <span className="h-5 w-px bg-rose-200/60" aria-hidden="true" />

              {/* Desktop Nav Links */}
              <nav
                aria-label="Main Navigation"
                className="flex items-center gap-1.5 lg:gap-3"
              >
                <Link
                  href="/browse"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isLinkActive("/browse")
                      ? "bg-rose-50 font-semibold text-rose-900"
                      : "text-gray-600 hover:bg-rose-50/70 hover:text-rose-800"
                  }`}
                >
                  Browse Outfits
                </Link>

                <Link
                  href="/how-it-works"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isLinkActive("/how-it-works")
                      ? "bg-rose-50 font-semibold text-rose-900"
                      : "text-gray-600 hover:bg-rose-50/70 hover:text-rose-800"
                  }`}
                >
                  How It Works
                </Link>

                <Link
                  href="/rent-your-outfit"
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isLinkActive("/rent-your-outfit")
                      ? "bg-amber-50 font-semibold text-amber-950"
                      : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-900"
                  }`}
                >
                  <span>Rent Your Outfit</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 transition-transform group-hover:scale-105">
                    Earn
                  </span>
                </Link>
              </nav>
            </div>

            {/* ── DESKTOP RIGHT ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              {/* 1. Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search dialog"
                className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3.5 text-xs text-gray-500 shadow-xs transition-all hover:border-rose-300 hover:bg-white hover:text-gray-800 hover:shadow-sm"
              >
                <Search size={15} className="text-rose-700" />
                <span className="pr-1 text-gray-500 font-normal">Search outfits...</span>
                <kbd className="hidden sm:inline-flex rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  ⌘K
                </kbd>
              </button>

              {/* 2. My Bookings */}
              <Link
                href={user ? "/bookings" : "/auth/login?next=/bookings"}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isLinkActive("/bookings")
                    ? "bg-rose-50 font-semibold text-rose-900"
                    : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-800"
                }`}
              >
                <Calendar size={16} className="text-rose-700 shrink-0" />
                <span>My Bookings</span>
              </Link>

              {/* 3. Account / Login */}
              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/50 py-1 pl-1 pr-2.5 text-sm font-medium text-gray-800 transition-all hover:border-rose-300 hover:bg-rose-100/60 focus:outline-none"
                    aria-expanded={isAccountMenuOpen}
                    aria-label="User account menu"
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={28}
                        height={28}
                        className="rounded-full ring-1 ring-rose-300 object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-700 text-xs font-bold text-white shadow-xs">
                        {initials}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate text-xs font-medium text-gray-700">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-150 ${
                        isAccountMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-rose-100/80 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="border-b border-rose-100/60 px-3 py-2.5">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="truncate text-[11px] text-gray-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                        >
                          <User size={15} className="text-rose-700" />
                          <span>My Account</span>
                        </Link>

                        <Link
                          href="/bookings"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                        >
                          <Calendar size={15} className="text-rose-700" />
                          <span>My Bookings</span>
                        </Link>

                        {user.role === "owner" && (
                          <Link
                            href="/dashboard"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-amber-700" />
                            <span>Owner Dashboard</span>
                          </Link>
                        )}

                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-900 hover:bg-rose-50 transition-colors"
                          >
                            <ShieldAlert size={15} className="text-rose-700" />
                            <span>Admin Console</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-rose-100/60 pt-1">
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            <span>Sign Out</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-rose-800 hover:to-rose-950 hover:shadow active:scale-[0.98]"
                >
                  <User size={15} />
                  <span>Account / Login</span>
                </Link>
              )}
            </div>
          </div>

          {/* =========================================================================
              MOBILE TOP HEADER (Visible on mobile screens < md)
              Clean, elegant top header without sidebar toggle:
              Left: ShaadiRent Logo | Right: Search & Account/Login
             ========================================================================= */}
          <div className="flex md:hidden h-14 items-center justify-between">
            {/* ShaadiRent Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 focus:outline-none"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-700 to-rose-900 text-sm shadow-xs"
              >
                💍
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-rose-950">
                ShaadiRent
              </span>
            </Link>

            {/* Right Action Icons: 🔍 Search + 👤 Account */}
            <div className="flex items-center gap-1.5">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search outfits"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-800 transition-colors focus:outline-none active:scale-95"
              >
                <Search size={20} strokeWidth={2.2} />
              </button>

              {/* User Account / Login Badge */}
              <Link
                href={user ? "/account" : "/auth/login"}
                aria-label={user ? "My Account" : "Login"}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-800 transition-colors focus:outline-none active:scale-95"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={26}
                    height={26}
                    className="rounded-full ring-1 ring-rose-400 object-cover"
                  />
                ) : user ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-700 text-[11px] font-bold text-white shadow-xs">
                    {initials}
                  </div>
                ) : (
                  <User size={20} strokeWidth={2.2} />
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-friendly Bottom Navigation Bar (No sidebar needed) */}
      <MobileBottomNav user={user} />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
