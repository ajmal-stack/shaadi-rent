"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Shirt,
  FolderTree,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Star,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminThemeToggle } from "./AdminThemeProvider";

/* ── Types ──────────────────────────────────────────────────── */
export interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | null;
}

export interface NavGroupConfig {
  title?: string;
  items: NavItemConfig[];
}

export interface AdminSidebarProps {
  children?: React.ReactNode;
  pendingApplications?: number;
  adminName?: string;
  adminEmail?: string;
  adminAvatar?: string | null;
}

/* ── Navigation Configuration ────────────────────────────────── */
function getNavGroups(pendingCount?: number): NavGroupConfig[] {
  return [
    {
      title: "Core",
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Accounts",
      items: [
        {
          href: "/admin/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/admin/owners",
          label: "Owners",
          icon: Store,
        },
      ],
    },
    {
      title: "Catalog",
      items: [
        {
          href: "/admin/outfits",
          label: "Outfits",
          icon: Shirt,
        },
        {
          href: "/admin/categories",
          label: "Categories",
          icon: FolderTree,
        },
      ],
    },
    {
      title: "Transactions",
      items: [
        {
          href: "/admin/bookings",
          label: "Bookings",
          icon: CalendarCheck,
        },
        {
          href: "/admin/payments",
          label: "Payments",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "Safety & Compliance",
      items: [
        {
          href: "/admin/applications",
          label: "Verification",
          icon: ShieldCheck,
          badge: pendingCount,
        },
        {
          href: "/admin/disputes",
          label: "Disputes",
          icon: AlertTriangle,
        },
        {
          href: "/admin/inspections",
          label: "Inspections",
          icon: ClipboardCheck,
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          href: "/admin/reviews",
          label: "Reviews",
          icon: Star,
        },
        {
          href: "/admin/customization",
          label: "Customization",
          icon: Palette,
        },
        {
          href: "/admin/settings",
          label: "Settings",
          icon: Settings,
        },
        {
          href: "/admin/help",
          label: "Help",
          icon: HelpCircle,
        },
      ],
    },
  ];
}

/* ── Individual Navigation Item ─────────────────────────────── */
function NavItemRow({
  item,
  collapsed,
  onClick,
}: {
  item: NavItemConfig;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;

  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-xs font-medium
        transition-all duration-200 select-none
        ${isActive
          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-semibold shadow-2xs ring-1 ring-rose-200/80 dark:ring-rose-800/60"
          : "text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 hover:text-stone-950 dark:hover:text-stone-100"
        }
        ${collapsed ? "justify-center px-2" : ""}
      `}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute -left-1 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-rose-600 to-amber-500 shadow-[0_0_6px_rgba(225,29,72,0.35)]" />
      )}

      {/* Icon with active highlight */}
      <Icon
        size={18}
        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive
            ? "text-rose-700 dark:text-rose-400"
            : "text-stone-400 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300"
          }`}
      />

      {/* Expanded Label */}
      {!collapsed && (
        <span className="flex-1 truncate tracking-tight">
          {item.label}
        </span>
      )}

      {/* Expanded Badge */}
      {item.badge != null && item.badge > 0 && !collapsed && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-1.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}

      {/* Collapsed Dot/Mini Badge */}
      {item.badge != null && item.badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-[9px] font-bold text-white ring-2 ring-white dark:ring-stone-900 shadow-xs animate-pulse">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}

      {/* Collapsed Floating Tooltip */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-stone-900/95 dark:bg-stone-800/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-stone-700/80 dark:ring-stone-600 backdrop-blur-md">
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="rounded-full bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">
                {item.badge}
              </span>
            )}
          </div>
        </div>
      )}
    </Link>

  );
}

/* ── Main Sidebar + Responsive Layout Shell ─────────────────── */
export function AdminSidebar({
  children,
  pendingApplications = 0,
  adminName = "Administrator",
  adminEmail = "admin@shaadirent.com",
  adminAvatar = null,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Sync collapsed preference with localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shaadi_admin_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("shaadi_admin_collapsed", String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle ESC key to dismiss mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const navGroups = getNavGroups(pendingApplications);

  // Compute current page label for topbar breadcrumb
  const currentItem = navGroups
    .flatMap((g) => g.items)
    .find((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href)
    );
  const pageTitle = currentItem ? currentItem.label : "Admin Console";

  /* ── Sidebar Internal Body ──────────────────────────────────── */
  const renderSidebarBody = (isDrawer = false) => {
    const isCollapsed = isDrawer ? false : collapsed;

    return (
      <div className="flex h-full flex-col justify-between overflow-hidden bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300">
        {/* Top Header / Branding */}
        <div className="flex flex-col shrink-0">
          <div
            className={`flex items-center gap-3 px-4 py-4.5 border-b border-stone-200/80 dark:border-stone-800 ${isCollapsed ? "justify-center px-2" : "justify-between"
              }`}
          >
            <Link
              href="/admin"
              className={`flex items-center gap-3 group transition-opacity hover:opacity-90 ${isCollapsed ? "justify-center" : ""
                }`}
            >
              {/* Brand Ring Emblem */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-lg shadow-sm shadow-rose-900/15 ring-1 ring-rose-300/40 dark:ring-rose-500/30 transition-transform group-hover:scale-105">
                💍
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-base font-bold text-stone-950 dark:text-stone-100 leading-none tracking-tight">
                      ShaadiRent
                    </span>
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-800 dark:text-rose-400 leading-none">
                      Admin Console
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Close Button on Mobile Drawer */}
            {isDrawer && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Close admin menu"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sleek-scrollbar">
          <div className="space-y-4">
            {navGroups.map((group, gi) => (
              <div key={gi} className="space-y-1">
                {/* Group Heading (expanded only) */}
                {group.title && !isCollapsed && (
                  <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 select-none">
                    {group.title}
                  </p>
                )}

                {/* Group Divider (collapsed only) */}
                {isCollapsed && gi > 0 && (
                  <div className="my-2 border-t border-stone-200/80 dark:border-stone-800 mx-1" />
                )}

                {/* Group Links */}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavItemRow
                      key={item.href}
                      item={item}
                      collapsed={isCollapsed}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Admin Profile & Actions */}
        <div className="shrink-0 border-t border-stone-200/80 dark:border-stone-800 p-3 space-y-2 bg-stone-50/60 dark:bg-stone-950/40">
          {/* Quick External Storefront Link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? "View Live Storefront" : undefined}
            className={`
              group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-400
              hover:bg-white dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-stone-100 hover:shadow-2xs hover:ring-1 hover:ring-stone-200/70 dark:hover:ring-stone-700 transition-all
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <ExternalLink size={16} className="shrink-0 text-stone-400 group-hover:text-rose-700 dark:group-hover:text-rose-400" />
            {!isCollapsed && (
              <span className="flex-1 truncate tracking-tight">View Storefront</span>
            )}
            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
                <div className="whitespace-nowrap rounded-lg bg-stone-900/95 dark:bg-stone-800/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-stone-700/80 dark:ring-stone-600 backdrop-blur-md">
                  View Live Storefront
                </div>
              </div>
            )}
          </Link>

          {/* Admin User Card */}
          <div
            className={`
              flex items-center gap-3 rounded-xl p-2 bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 shadow-2xs
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <div className="relative shrink-0">
              {adminAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="h-8 w-8 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 text-xs font-bold text-white shadow-inner ring-1 ring-rose-200/60 dark:ring-rose-800/40">
                  {initials}
                </div>
              )}
              {/* Online indicator dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-800" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                  {adminName}
                </p>
                <p className="truncate text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  {adminEmail}
                </p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`
              group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium
              text-stone-600 dark:text-stone-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:ring-1 hover:ring-rose-200/60 dark:hover:ring-rose-800/50 transition-all duration-150
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <LogOut size={16} className="shrink-0 text-stone-400 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
            {!isCollapsed && <span className="tracking-tight">Sign Out</span>}

            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
                <div className="whitespace-nowrap rounded-lg bg-stone-900/95 dark:bg-stone-800/95 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-xl ring-1 ring-stone-700/80 dark:ring-stone-600 backdrop-blur-md">
                  Sign Out
                </div>
              </div>
            )}
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 py-2 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 shadow-2xs transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={15} className="text-rose-700 dark:text-rose-400" />
            ) : (
              <>
                <ChevronLeft size={15} />
                <span className="font-medium text-[11px]">Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  /* ── Layout Wrap ────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-rose-100 dark:selection:bg-rose-950 selection:text-rose-900 dark:selection:text-rose-200">
      {/* ── Mobile Sticky Topbar (< lg) ─────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 px-4 backdrop-blur-md text-stone-900 dark:text-stone-100 shadow-2xs">
        {/* Left: Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ring-1 ring-stone-200/80 dark:ring-stone-700"
          aria-label="Open administration navigation"
        >
          <Menu size={20} />
        </button>

        {/* Center: Brand & Section */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 text-sm shadow-xs ring-1 ring-rose-200/60 dark:ring-rose-500/30">
            💍
          </div>
          <div className="text-left">
            <span className="font-display text-sm font-bold text-stone-950 dark:text-stone-100 leading-none block">
              ShaadiRent
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 block mt-0.5">
              Admin Console
            </span>
          </div>
        </Link>

        {/* Right: Theme Toggle + Verification Badge + Avatar */}
        <div className="flex items-center gap-2">
          <AdminThemeToggle />

          {pendingApplications > 0 && (
            <Link
              href="/admin/applications"
              className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800/60"
            >
              <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400" />
              <span>{pendingApplications}</span>
            </Link>
          )}

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-rose-900 text-xs font-bold text-white ring-1 ring-rose-200/60 dark:ring-rose-800 shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer (< lg) ────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800
          shadow-2xl transform transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {renderSidebarBody(true)}
      </aside>

      {/* ── Desktop Persistent Sidebar (>= lg) ──────────────────── */}
      <aside
        className={`
          hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col
          bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800 shadow-xs
          transition-[width] duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* ── Main Layout Body ───────────────────────────────────── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 min-h-screen
          transition-[padding-left] duration-300 ease-in-out
          ${collapsed ? "lg:pl-20" : "lg:pl-64"}
        `}
      >
        {/* Desktop Admin Header Bar */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 px-6 sm:px-8 backdrop-blur-md shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Quick Toggle Button in Header */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 shadow-2xs transition-all"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400 dark:text-stone-500">Admin</span>
              <span className="text-stone-300 dark:text-stone-600">/</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Platform Security Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Production Admin</span>
            </div>

            {/* Pending Verification Pill */}
            {pendingApplications > 0 && (
              <Link
                href="/admin/applications"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors shadow-2xs"
              >
                <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400" />
                <span>{pendingApplications} Pending Verification</span>
              </Link>
            )}

            {/* Storefront Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-600 shadow-2xs transition-all"
            >
              <span>Storefront</span>
              <ExternalLink size={13} />
            </Link>

            {/* Admin Theme Toggle */}
            <AdminThemeToggle />

            {/* Admin Avatar Preview */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-700 to-rose-950 text-xs font-bold text-white shadow-xs ring-1 ring-amber-400/40">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 py-4 px-6 sm:px-8 text-center text-xs text-stone-400 dark:text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors">
          <span>ShaadiRent Administrative Control Suite • Version 2.0</span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            Protected by Row-Level Security & Role Authentication
          </span>
        </footer>
      </div>
    </div>

  );
}

/* Alias export for flexible imports */
export { AdminSidebar as AdminShell };
