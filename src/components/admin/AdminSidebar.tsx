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
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
        ${
          isActive
            ? "bg-gradient-to-r from-rose-950/70 via-rose-900/35 to-rose-900/10 text-white shadow-sm ring-1 ring-rose-700/30"
            : "text-stone-300 hover:bg-white/[0.06] hover:text-white"
        }
        ${collapsed ? "justify-center px-2" : ""}
      `}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute -left-1 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-amber-400 via-rose-500 to-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
      )}

      {/* Icon with active highlight */}
      <Icon
        size={18}
        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
          isActive
            ? "text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]"
            : "text-stone-400 group-hover:text-amber-300"
        }`}
      />

      {/* Expanded Label */}
      {!collapsed && (
        <span className="flex-1 truncate tracking-tight font-medium">
          {item.label}
        </span>
      )}

      {/* Expanded Badge */}
      {item.badge != null && item.badge > 0 && !collapsed && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-1.5 text-[10px] font-extrabold text-stone-950 shadow-xs shadow-amber-950/40 animate-pulse">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}

      {/* Collapsed Dot/Mini Badge */}
      {item.badge != null && item.badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[9px] font-extrabold text-stone-950 ring-2 ring-stone-950 shadow-sm animate-pulse">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}

      {/* Collapsed Floating Tooltip */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-stone-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-stone-700/80 backdrop-blur-md">
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
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
      <div className="flex h-full flex-col justify-between overflow-hidden bg-stone-950 text-stone-300">
        {/* Top Header / Branding */}
        <div className="flex flex-col shrink-0">
          <div
            className={`flex items-center gap-3 px-4 py-4.5 border-b border-white/[0.08] ${
              isCollapsed ? "justify-center px-2" : "justify-between"
            }`}
          >
            <Link
              href="/admin"
              className={`flex items-center gap-3 group transition-opacity hover:opacity-90 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              {/* Brand Ring Emblem */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-800 to-rose-950 text-lg shadow-md shadow-rose-950/60 ring-1 ring-amber-400/40 transition-transform group-hover:scale-105">
                💍
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-base font-bold text-white leading-none tracking-tight">
                      ShaadiRent
                    </span>
                    <Sparkles size={12} className="text-amber-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90 leading-none">
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
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-stone-400 hover:text-white hover:bg-white/[0.12] transition-colors"
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
                  <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 select-none">
                    {group.title}
                  </p>
                )}

                {/* Group Divider (collapsed only) */}
                {isCollapsed && gi > 0 && (
                  <div className="my-2 border-t border-white/[0.06] mx-1" />
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
        <div className="shrink-0 border-t border-white/[0.08] p-3 space-y-2 bg-stone-950/80">
          {/* Quick External Storefront Link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? "View Live Storefront" : undefined}
            className={`
              group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-stone-400
              hover:bg-white/[0.06] hover:text-white transition-all
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <ExternalLink size={16} className="shrink-0 text-stone-400 group-hover:text-amber-400" />
            {!isCollapsed && (
              <span className="flex-1 truncate tracking-tight">View Storefront</span>
            )}
            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
                <div className="whitespace-nowrap rounded-lg bg-stone-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-stone-700/80 backdrop-blur-md">
                  View Live Storefront
                </div>
              </div>
            )}
          </Link>

          {/* Admin User Card */}
          <div
            className={`
              flex items-center gap-3 rounded-xl p-2 bg-white/[0.03] ring-1 ring-white/[0.05]
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <div className="relative shrink-0">
              {adminAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="h-8 w-8 rounded-xl object-cover ring-1 ring-amber-400/40"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-950 text-xs font-bold text-white shadow-inner ring-1 ring-amber-400/30">
                  {initials}
                </div>
              )}
              {/* Online indicator dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-stone-950" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white leading-tight">
                  {adminName}
                </p>
                <p className="truncate text-[10px] text-stone-500 leading-tight">
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
              text-stone-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-150
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <LogOut size={16} className="shrink-0 text-stone-400 group-hover:text-rose-400" />
            {!isCollapsed && <span className="tracking-tight">Sign Out</span>}

            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-3 z-50 hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150 items-center">
                <div className="whitespace-nowrap rounded-lg bg-stone-900/95 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-xl ring-1 ring-stone-700/80 backdrop-blur-md">
                  Sign Out
                </div>
              </div>
            )}
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 text-xs text-stone-400 hover:bg-white/[0.06] hover:text-white transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={15} className="text-amber-400" />
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
    <div className="relative min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* ── Mobile Sticky Topbar (< lg) ─────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-800/80 bg-stone-950/95 px-4 backdrop-blur-md text-white shadow-md">
        {/* Left: Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white hover:bg-white/[0.14] transition-colors ring-1 ring-white/10"
          aria-label="Open administration navigation"
        >
          <Menu size={20} />
        </button>

        {/* Center: Brand & Section */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-950 text-sm shadow ring-1 ring-amber-400/40">
            💍
          </div>
          <div className="text-left">
            <span className="font-display text-sm font-bold text-white leading-none block">
              ShaadiRent
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block mt-0.5">
              Admin Console
            </span>
          </div>
        </Link>

        {/* Right: Quick Verification Badge or Avatar */}
        <div className="flex items-center gap-2">
          {pendingApplications > 0 && (
            <Link
              href="/admin/applications"
              className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30"
            >
              <ShieldAlert size={14} className="text-amber-400" />
              <span>{pendingApplications}</span>
            </Link>
          )}

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-900 text-xs font-bold text-white ring-1 ring-amber-400/30">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer (< lg) ────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-stone-950 border-r border-stone-800
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
          bg-stone-950 border-r border-stone-800/80 shadow-2xl
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
        <header className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between border-b border-stone-200/80 bg-white/85 px-6 sm:px-8 backdrop-blur-md shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Quick Toggle Button in Header */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-2xs transition-all"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400">Admin</span>
              <span className="text-stone-300">/</span>
              <span className="font-semibold text-stone-900">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Platform Security Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Production Admin</span>
            </div>

            {/* Pending Verification Pill */}
            {pendingApplications > 0 && (
              <Link
                href="/admin/applications"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100/80 transition-colors shadow-2xs"
              >
                <ShieldAlert size={14} className="text-amber-600" />
                <span>{pendingApplications} Pending Verification</span>
              </Link>
            )}

            {/* Storefront Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:border-stone-300 shadow-2xs transition-all"
            >
              <span>Storefront</span>
              <ExternalLink size={13} />
            </Link>

            {/* Admin Avatar Preview */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
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
        <footer className="border-t border-stone-200/80 bg-stone-100/50 py-4 px-6 sm:px-8 text-center text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ShaadiRent Administrative Control Suite • Version 2.0</span>
          <span className="text-[11px] text-stone-400">
            Protected by Row-Level Security & Role Authentication
          </span>
        </footer>
      </div>
    </div>
  );
}

/* Alias export for flexible imports */
export { AdminSidebar as AdminShell };
