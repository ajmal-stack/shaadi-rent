"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Sparkles,
  HelpCircle,
  PlusCircle,
  Calendar,
  User,
  LogOut,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { signOut } from "@/app/(public)/auth/actions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const close = useCallback(() => onClose(), [onClose]);

  // Lock scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const roleLabel =
    user?.role === "owner"
      ? "Boutique Owner"
      : user?.role === "admin"
        ? "Platform Admin"
        : "Customer";

  return (
    <>
      {/* Backdrop overlay */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Drawer (slides in from left) */}
      <div
        id="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-rose-100/70 bg-gradient-to-r from-rose-900 to-rose-950 px-5 py-4 text-white">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-base shadow-xs ring-1 ring-amber-400/40"
            >
              💍
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-amber-100">
              ShaadiRent
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card / Guest Welcome */}
        <div className="border-b border-rose-100/60 bg-rose-50/40 p-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={44}
                  height={44}
                  className="rounded-full ring-2 ring-rose-300 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-700 to-rose-900 text-sm font-bold text-white shadow-sm ring-2 ring-rose-200">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
                <span className="mt-0.5 inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-800">
                  {roleLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-3.5 shadow-xs border border-rose-100">
              <p className="font-display text-sm font-semibold text-rose-950">
                Welcome to ShaadiRent
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Wear luxury designer outfits at a fraction of retail price.
              </p>
              <Link
                href="/auth/login"
                onClick={close}
                className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors"
              >
                <LogIn size={14} />
                Sign in / Register
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Items (Exact items requested by user) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1 text-sm font-medium">
            {/* 1. Browse Outfits */}
            <li>
              <Link
                href="/browse"
                onClick={close}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/70 text-rose-700">
                  <Sparkles size={18} />
                </div>
                <span className="font-medium">Browse Outfits</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </Link>
            </li>

            {/* 2. How It Works */}
            <li>
              <Link
                href="/how-it-works"
                onClick={close}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/70 text-rose-700">
                  <HelpCircle size={18} />
                </div>
                <span className="font-medium">How It Works</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </Link>
            </li>

            {/* 3. Rent Your Outfit */}
            <li>
              <Link
                href="/rent-your-outfit"
                onClick={close}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <PlusCircle size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rent Your Outfit</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Earn
                  </span>
                </div>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </Link>
            </li>

            {/* 4. My Bookings */}
            <li>
              <Link
                href={user ? "/bookings" : "/auth/login?next=/bookings"}
                onClick={close}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/70 text-rose-700">
                  <Calendar size={18} />
                </div>
                <span className="font-medium">My Bookings</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </Link>
            </li>

            {/* 5. Account */}
            <li>
              <Link
                href={user ? "/account" : "/auth/login"}
                onClick={close}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/70 text-rose-700">
                  <User size={18} />
                </div>
                <span className="font-medium">Account</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Drawer Footer: 6. Sign Out (or Login) + Tagline */}
        <div className="border-t border-rose-100/70 bg-stone-50/70 p-4">
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 shadow-xs transition-all hover:bg-rose-50 active:scale-[0.98]"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              onClick={close}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:from-rose-800 hover:to-rose-900 active:scale-[0.98]"
            >
              <LogIn size={16} />
              Login / Sign In
            </Link>
          )}

          <p className="mt-3 text-center text-[11px] text-gray-400">
            ShaadiRent • Rent. Wear. Return.
          </p>
        </div>
      </div>
    </>
  );
}
