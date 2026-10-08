"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Calendar,
  Heart,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  Bell,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { MobileMenu, AuthUser } from "./MobileMenu";
import { SearchModal } from "./SearchModal";
import { MobileBottomNav } from "./MobileBottomNav";
import { signOut } from "@/app/(public)/auth/actions";
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type UserNotificationItem,
} from "@/app/(customer)/account/actions";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [navNotifications, setNavNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close account & notif dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(e.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread notifications
  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUserNotificationsAction();
      if (res.success && res.notifications) {
        setNavNotifications(res.notifications.slice(0, 8));
        setUnreadNotifCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Could not load nav notifications:", err);
    }
  }, [user]);

  // Handler when user toggles or opens notification bell
  // Instantly marks all loaded notifications as read in both local UI and database
  const handleToggleNotif = async () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);

    if (nextState && unreadNotifCount > 0) {
      // 1. Immediately zero-out unread badge & mark read locally
      setUnreadNotifCount(0);
      setNavNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );

      // 2. Persist to database in background
      try {
        await markAllNotificationsReadAction();
      } catch (err) {
        console.warn("Could not mark all notifications as read:", err);
      }
    }
  };

  // Explicit mark-all-read button inside dropdown
  const handleMarkAllRead = async () => {
    setUnreadNotifCount(0);
    setNavNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    try {
      await markAllNotificationsReadAction();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  // Handler when clicking a specific notification item
  const handleNotificationItemClick = async (notif: UserNotificationItem) => {
    setIsNotifOpen(false);
    if (!notif.read_at) {
      setNavNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationReadAction(notif.id);
      } catch (err) {
        console.warn("Could not mark notification as read:", err);
      }
    }
  };

  // Live Realtime notifications subscription + Active background polling
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Initial fetch
    fetchNotifs();

    // Supabase Realtime channel subscription (Postgres WAL changes + Broadcast events)
    const supabase = createBrowserSupabaseClient();
    const channelName = `realtime-notifications-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as UserNotificationItem;
          if (!newNotif || !isMounted) return;

          setNavNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev].slice(0, 8);
          });
          setUnreadNotifCount((prev) => prev + 1);

          toast(newNotif.title, {
            description: newNotif.message,
            duration: 6000,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as UserNotificationItem;
          if (!updated || !isMounted) return;

          setNavNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          if (updated.read_at) {
            setUnreadNotifCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        "broadcast",
        { event: "notification_created" },
        (response) => {
          const newNotif = response.payload as UserNotificationItem;
          if (!newNotif || !isMounted) return;

          setNavNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev].slice(0, 8);
          });
          setUnreadNotifCount((prev) => prev + 1);

          toast(newNotif.title, {
            description: newNotif.message,
            duration: 6000,
          });
        }
      )
      .subscribe();

    // Active polling every 10s as a rock-solid safety net
    const pollInterval = setInterval(() => {
      fetchNotifs();
    }, 10000);

    // Tab visibility and focus sync
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [user?.id, fetchNotifs]);

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
              Right: Search | My Bookings | Wishlist | Account/Login
             ========================================================================= */}
          <div className="hidden md:flex h-16 lg:h-18 items-center justify-between gap-2 lg:gap-4">
            {/* ── DESKTOP LEFT ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 lg:gap-5 xl:gap-8 min-w-0 shrink-0">
              {/* Brand Logo */}
              <Link
                href="/"
                className="group flex items-center gap-2 lg:gap-2.5 shrink-0 focus:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 text-sm lg:text-base shadow-sm ring-1 ring-amber-300/40 transition-transform duration-200 group-hover:scale-105 shrink-0"
                >
                  💍
                </span>
                <span className="font-display text-xl lg:text-2xl font-bold tracking-tight text-rose-950 transition-colors group-hover:text-rose-800 shrink-0">
                  ShaadiRent
                </span>
              </Link>

              {/* Vertical divider (visible on xl and up) */}
              <span className="hidden xl:block h-5 w-px bg-rose-200/60 shrink-0" aria-hidden="true" />

              {/* Desktop Nav Links */}
              <nav
                aria-label="Main Navigation"
                className="flex items-center gap-1 lg:gap-2 xl:gap-3 shrink-0"
              >
                <Link
                  href="/browse"
                  className={`rounded-lg px-2.5 py-1.5 lg:px-3 text-xs lg:text-sm font-medium transition-colors shrink-0 ${
                    isLinkActive("/browse")
                      ? "bg-rose-50 font-semibold text-rose-900"
                      : "text-gray-600 hover:bg-rose-50/70 hover:text-rose-800"
                  }`}
                >
                  <span className="inline lg:hidden">Browse</span>
                  <span className="hidden lg:inline">Browse Outfits</span>
                </Link>

                <Link
                  href="/how-it-works"
                  className={`hidden lg:inline-flex rounded-lg px-2.5 py-1.5 lg:px-3 text-xs lg:text-sm font-medium transition-colors shrink-0 ${
                    isLinkActive("/how-it-works")
                      ? "bg-rose-50 font-semibold text-rose-900"
                      : "text-gray-600 hover:bg-rose-50/70 hover:text-rose-800"
                  }`}
                >
                  How It Works
                </Link>

                <Link
                  href={user ? "/list-your-outfit" : "/rent-your-outfit"}
                  className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 lg:px-3 text-xs lg:text-sm font-medium transition-colors shrink-0 ${
                    isLinkActive("/rent-your-outfit") || isLinkActive("/list-your-outfit")
                      ? "bg-amber-50 font-semibold text-amber-950"
                      : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-900"
                  }`}
                >
                  <span className="inline xl:hidden">Rent & Earn</span>
                  <span className="hidden xl:inline">Rent Your Outfit</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] lg:text-[10px] font-semibold text-amber-900 transition-transform group-hover:scale-105">
                    Earn
                  </span>
                </Link>
              </nav>
            </div>

            {/* ── DESKTOP RIGHT ────────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 lg:gap-2.5 xl:gap-3 shrink-0">
              {/* 1. Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search dialog"
                className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-2.5 lg:px-3.5 text-xs text-gray-500 shadow-xs transition-all hover:border-rose-300 hover:bg-white hover:text-gray-800 hover:shadow-sm shrink-0 cursor-pointer"
              >
                <Search size={15} className="text-rose-700 shrink-0" />
                <span className="hidden lg:inline pr-1 text-gray-500 font-normal">
                  <span className="inline xl:hidden">Search...</span>
                  <span className="hidden xl:inline">Search outfits...</span>
                </span>
                <kbd className="hidden xl:inline-flex rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  ⌘K
                </kbd>
              </button>

              {/* 2. My Bookings */}
              <Link
                href={user ? "/bookings" : "/auth/login?next=/bookings"}
                title="My Bookings"
                className={`flex items-center gap-1.5 rounded-xl p-2 lg:px-2.5 lg:py-2 xl:px-3 text-xs lg:text-sm font-medium transition-colors shrink-0 ${
                  isLinkActive("/bookings")
                    ? "bg-rose-50 font-semibold text-rose-900"
                    : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-800"
                }`}
              >
                <Calendar size={16} className="text-rose-700 shrink-0" />
                <span className="hidden lg:inline">
                  <span className="inline xl:hidden">Bookings</span>
                  <span className="hidden xl:inline">My Bookings</span>
                </span>
              </Link>

              {/* 2.5. Wishlist */}
              <Link
                href={user ? "/wishlist" : "/auth/login?next=/wishlist"}
                title="Saved Wishlist"
                data-wishlist-target="desktop"
                className={`flex items-center gap-1.5 rounded-xl p-2 lg:px-2.5 lg:py-2 xl:px-3 text-xs lg:text-sm font-medium transition-colors shrink-0 ${
                  isLinkActive("/wishlist")
                    ? "bg-rose-50 font-semibold text-rose-900"
                    : "text-gray-700 hover:bg-rose-50/70 hover:text-rose-800"
                }`}
              >
                <Heart
                  size={16}
                  className={`nav-wishlist-icon shrink-0 transition-transform ${
                    isLinkActive("/wishlist")
                      ? "fill-rose-700 text-rose-700"
                      : "text-rose-700"
                  }`}
                />
                <span className="hidden lg:inline">Wishlist</span>
              </Link>

              {/* 2.8. Notifications Bell (Signed-in users) */}
              {user && (
                <div className="relative shrink-0" ref={notifMenuRef}>
                  <button
                    type="button"
                    onClick={handleToggleNotif}
                    title="Rental Notifications"
                    aria-label="Rental Notifications"
                    className="relative flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-rose-50/70 hover:text-rose-800 transition-colors cursor-pointer"
                  >
                    <Bell size={18} className="text-rose-700 shrink-0" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-rose-100/90 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="flex items-center justify-between border-b border-rose-100/60 pb-2 px-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">Notifications</h4>
                          {unreadNotifCount > 0 && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                              {unreadNotifCount} new
                            </span>
                          )}
                        </div>
                        {navNotifications.some((n) => !n.read_at) && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-[11px] font-medium text-rose-800 hover:text-rose-950 hover:underline cursor-pointer"
                          >
                            <CheckCheck size={13} />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="py-2 max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {navNotifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-400">
                            No notifications yet
                          </div>
                        ) : (
                          navNotifications.map((notif) => (
                            <Link
                              key={notif.id}
                              href={notif.booking_id ? `/bookings/${notif.booking_id}` : "/bookings"}
                              onClick={() => handleNotificationItemClick(notif)}
                              className={`block p-2.5 rounded-xl transition-colors hover:bg-rose-50/50 ${
                                !notif.read_at ? "bg-rose-50/40" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                                  {notif.title}
                                </p>
                                {!notif.read_at && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-stone-400 mt-1 block">
                                {new Date(notif.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="border-t border-rose-100/60 pt-2 text-center">
                        <Link
                          href="/bookings"
                          onClick={() => setIsNotifOpen(false)}
                          className="text-xs font-semibold text-rose-900 hover:text-rose-950 block py-1"
                        >
                          View all My Bookings →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Account / Login */}
              {user ? (
                <div className="relative shrink-0" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 lg:gap-2 rounded-full border border-rose-200/80 bg-rose-50/50 py-1 pl-1 pr-1.5 lg:pr-2.5 text-xs lg:text-sm font-medium text-gray-800 transition-all hover:border-rose-300 hover:bg-rose-100/60 focus:outline-none shrink-0 cursor-pointer"
                    aria-expanded={isAccountMenuOpen}
                    aria-label="User account menu"
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={28}
                        height={28}
                        className="rounded-full ring-1 ring-rose-300 object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-700 text-xs font-bold text-white shadow-xs shrink-0">
                        {initials}
                      </div>
                    )}
                    <span className="hidden xl:inline max-w-[90px] truncate text-xs font-medium text-gray-700">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-150 shrink-0 ${
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

                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            handleToggleNotif();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors text-left cursor-pointer"
                        >
                          <Bell size={15} className="text-rose-700 shrink-0" />
                          <span>Notifications &amp; Alerts</span>
                          {unreadNotifCount > 0 && (
                            <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-900">
                              {unreadNotifCount}
                            </span>
                          )}
                        </button>

                        <Link
                          href="/bookings"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                        >
                          <Calendar size={15} className="text-rose-700" />
                          <span>My Bookings</span>
                        </Link>

                        <Link
                          href="/wishlist"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                        >
                          <Heart size={15} className="text-rose-700" />
                          <span>Saved Wishlist</span>
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
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-rose-800 hover:to-rose-950 hover:shadow active:scale-[0.98] shrink-0"
                >
                  <User size={15} className="shrink-0" />
                  <span className="inline lg:hidden">Sign In</span>
                  <span className="hidden lg:inline">Account / Login</span>
                </Link>
              )}
            </div>
          </div>

          {/* =========================================================================
              MOBILE TOP HEADER (Visible on mobile screens < md)
              Left: Menu Button + ShaadiRent Logo | Right: Search + Wishlist + Profile / Login
             ========================================================================= */}
          <div className="flex md:hidden h-14 items-center justify-between gap-1">
            {/* Left: Hamburger Menu Button + Logo */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors focus:outline-none active:scale-95 shrink-0"
              >
                <Menu size={22} strokeWidth={2.2} />
              </button>

              <Link
                href="/"
                className="flex items-center gap-1.5 sm:gap-2 focus:outline-none shrink-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-700 to-rose-900 text-sm shadow-xs shrink-0"
                >
                  💍
                </span>
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-rose-950 shrink-0">
                  ShaadiRent
                </span>
              </Link>
            </div>

            {/* Right Action Icons: 🔍 Search + 🔔 Notifications + ❤️ Wishlist + 👤 Profile / Account Badge */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search outfits"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-800 transition-colors focus:outline-none active:scale-95 shrink-0"
              >
                <Search size={19} strokeWidth={2.2} />
              </button>

              {/* Mobile Notification Bell (Signed-in users) */}
              {user && (
                <button
                  type="button"
                  onClick={handleToggleNotif}
                  title="Rental Notifications"
                  aria-label="Rental Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-800 transition-colors focus:outline-none active:scale-95 shrink-0 cursor-pointer"
                >
                  <Bell size={19} strokeWidth={2.2} className="text-rose-700 shrink-0" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  )}
                </button>
              )}

              {/* Wishlist Link */}
              <Link
                href={user ? "/wishlist" : "/auth/login?next=/wishlist"}
                aria-label="Saved Wishlist"
                data-wishlist-target="mobile"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95 shrink-0 ${
                  isLinkActive("/wishlist")
                    ? "bg-rose-100 text-rose-800"
                    : "text-gray-700 hover:bg-rose-50 hover:text-rose-800"
                }`}
              >
                <Heart
                  size={19}
                  strokeWidth={2.2}
                  className={`nav-wishlist-icon transition-transform ${
                    isLinkActive("/wishlist")
                      ? "fill-rose-700 text-rose-700"
                      : "text-rose-700"
                  }`}
                />
              </Link>

              {/* User Profile Pill / Login Link */}
              <Link
                href={user ? "/account" : "/auth/login"}
                aria-label={user ? `My Profile (${user.name})` : "Login / Account"}
                className="flex h-9 items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/70 px-2 py-1 text-xs font-semibold text-rose-950 transition-all hover:border-rose-300 hover:bg-rose-100/70 active:scale-95 shadow-2xs shrink-0"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={22}
                    height={22}
                    className="rounded-full ring-1 ring-rose-400 object-cover shrink-0"
                  />
                ) : user ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-700 to-rose-900 text-[10px] font-bold text-white shadow-xs shrink-0">
                    {initials}
                  </div>
                ) : (
                  <User size={16} strokeWidth={2.2} className="text-rose-800 shrink-0" />
                )}
                <span className="hidden min-[380px]:inline max-w-[65px] sm:max-w-[80px] truncate text-[11px] font-semibold text-rose-950">
                  {user ? user.name.split(" ")[0] : "Login"}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Notifications Popover when open on mobile (< md) */}
        {isNotifOpen && (
          <div className="block md:hidden border-t border-rose-100 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-rose-100/60 pb-2 px-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gray-900">Notifications</h4>
                {unreadNotifCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                    {unreadNotifCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {navNotifications.some((n) => !n.read_at) && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-rose-800 hover:text-rose-950 hover:underline cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 px-1"
                  aria-label="Close notifications"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="py-2 max-h-72 overflow-y-auto divide-y divide-stone-100">
              {navNotifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No notifications yet
                </div>
              ) : (
                navNotifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.booking_id ? `/bookings/${notif.booking_id}` : "/bookings"}
                    onClick={() => handleNotificationItemClick(notif)}
                    className={`block p-2.5 rounded-xl transition-colors hover:bg-rose-50/50 ${
                      !notif.read_at ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                        {notif.title}
                      </p>
                      {!notif.read_at && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      {new Date(notif.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </Link>
                ))
              )}
            </div>

            <div className="border-t border-rose-100/60 pt-2 text-center">
              <Link
                href="/bookings"
                onClick={() => setIsNotifOpen(false)}
                className="text-xs font-semibold text-rose-900 hover:text-rose-950 block py-1"
              >
                View all My Bookings →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer (Menu + Full Profile Card & Navigation) */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onOpenNotifications={handleToggleNotif}
        unreadNotifCount={unreadNotifCount}
      />

      {/* Mobile-friendly Bottom Navigation Bar */}
      <MobileBottomNav user={user} />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
