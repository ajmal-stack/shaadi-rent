"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Palette,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  ZapOff,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Store,
  User,
  CalendarCheck,
  LayoutDashboard,
  Star,
  CreditCard,
  Bell,
  PackageCheck,
  Truck,
  ClipboardCheck,
  Sparkles,
  RotateCw,
  Box,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────── */
type RoleKey = "admin" | "owner" | "customer";
type ControlId = string;

interface ControlPermission {
  visible: boolean;
  actionable: boolean;
}

type RolePermissions = Record<ControlId, ControlPermission>;
type PermissionsState = Record<RoleKey, RolePermissions>;

interface ControlItem {
  id: ControlId;
  label: string;
  description: string;
  icon: React.ElementType;
  hasAction: boolean; // Whether this control has an "actionable" toggle
  actionLabel?: string;
}

interface ControlGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  controls: ControlItem[];
}

/* ── Control Groups & Items ─────────────────────────────────── */
const CONTROL_GROUPS: ControlGroup[] = [
  {
    id: "booking_progress",
    title: "Booking Progress Steps",
    subtitle: "Control which booking stages each role can see and act on.",
    icon: CalendarCheck,
    controls: [
      {
        id: "step_booking_pending",
        label: "Booking Pending",
        description: "Initial step shown when a booking request is placed.",
        icon: Circle,
        hasAction: false,
      },
      {
        id: "step_booking_confirmed",
        label: "Booking Confirmed",
        description: "Owner has confirmed the booking request.",
        icon: CheckCircle2,
        hasAction: true,
        actionLabel: "Can confirm booking",
      },
      {
        id: "step_pre_delivery_inspection",
        label: "Pre-delivery Inspection",
        description: "Outfit inspection before dispatch.",
        icon: ClipboardCheck,
        hasAction: true,
        actionLabel: "Can mark inspected",
      },
      {
        id: "step_outfit_dispatched",
        label: "Outfit Dispatched",
        description: "Outfit sent out for delivery.",
        icon: Truck,
        hasAction: true,
        actionLabel: "Can mark dispatched",
      },
      {
        id: "step_outfit_delivered",
        label: "Outfit Delivered",
        description: "Outfit delivered to the customer.",
        icon: PackageCheck,
        hasAction: true,
        actionLabel: "Can confirm delivery",
      },
      {
        id: "step_active_rental",
        label: "Active Rental — Event Day",
        description: "Rental is currently active; event is happening.",
        icon: Sparkles,
        hasAction: false,
      },
      {
        id: "step_return_pickup",
        label: "Return Pickup Scheduled",
        description: "Customer has scheduled the return pickup.",
        icon: RotateCw,
        hasAction: true,
        actionLabel: "Can schedule return",
      },
      {
        id: "step_outfit_returned",
        label: "Outfit Returned",
        description: "Outfit has been collected back.",
        icon: Box,
        hasAction: true,
        actionLabel: "Can mark returned",
      },
      {
        id: "step_post_return_inspection",
        label: "Post-return Inspection",
        description: "Inspection of outfit after rental period.",
        icon: ClipboardCheck,
        hasAction: true,
        actionLabel: "Can complete inspection",
      },
      {
        id: "step_booking_completed",
        label: "Booking Completed",
        description: "Booking fully closed and deposit settled.",
        icon: Star,
        hasAction: false,
      },
    ],
  },
  {
    id: "dashboard_widgets",
    title: "Dashboard Widgets",
    subtitle: "Toggle which dashboard sections are visible per role.",
    icon: LayoutDashboard,
    controls: [
      {
        id: "widget_stats_overview",
        label: "Stats Overview Cards",
        description: "Revenue, booking count, and active rental summary cards.",
        icon: LayoutDashboard,
        hasAction: false,
      },
      {
        id: "widget_recent_bookings",
        label: "Recent Bookings Feed",
        description: "Live feed of the latest booking activity.",
        icon: CalendarCheck,
        hasAction: false,
      },
      {
        id: "widget_revenue_chart",
        label: "Revenue Chart",
        description: "Earnings trend graph over time.",
        icon: CreditCard,
        hasAction: false,
      },
      {
        id: "widget_reviews_panel",
        label: "Reviews Summary",
        description: "Star ratings and customer feedback widget.",
        icon: Star,
        hasAction: false,
      },
    ],
  },
  {
    id: "action_controls",
    title: "Action Buttons & Controls",
    subtitle: "Determine who can trigger specific platform actions.",
    icon: Zap,
    controls: [
      {
        id: "action_approve_owner",
        label: "Approve Owner Application",
        description: "Approve or reject boutique owner KYC applications.",
        icon: ShieldCheck,
        hasAction: true,
        actionLabel: "Can approve/reject",
      },
      {
        id: "action_manage_disputes",
        label: "Manage Disputes",
        description: "Open, update, and resolve rental disputes.",
        icon: ShieldCheck,
        hasAction: true,
        actionLabel: "Can resolve disputes",
      },
      {
        id: "action_process_refund",
        label: "Process Refund",
        description: "Manually trigger customer refund from escrow.",
        icon: CreditCard,
        hasAction: true,
        actionLabel: "Can trigger refund",
      },
      {
        id: "action_upload_outfit",
        label: "Upload & Edit Outfits",
        description: "Add, edit, or remove outfit listings.",
        icon: Store,
        hasAction: true,
        actionLabel: "Can edit listings",
      },
      {
        id: "action_leave_review",
        label: "Leave a Review",
        description: "Post a star rating and review after booking completion.",
        icon: Star,
        hasAction: true,
        actionLabel: "Can submit review",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notification Channels",
    subtitle: "Control which notification types are enabled per role.",
    icon: Bell,
    controls: [
      {
        id: "notif_booking_updates",
        label: "Booking Status Updates",
        description: "Alerts when a booking changes status.",
        icon: Bell,
        hasAction: false,
      },
      {
        id: "notif_payment_receipts",
        label: "Payment Receipts",
        description: "Email receipt after successful payment.",
        icon: CreditCard,
        hasAction: false,
      },
      {
        id: "notif_dispute_alerts",
        label: "Dispute Escalation Alerts",
        description: "Urgent notifications when disputes are raised.",
        icon: Bell,
        hasAction: false,
      },
      {
        id: "notif_review_prompts",
        label: "Review Prompts",
        description: "Post-rental prompt to leave a review.",
        icon: Star,
        hasAction: false,
      },
    ],
  },
];

/* ── Default permissions ────────────────────────────────────── */
function buildDefaultPermissions(): PermissionsState {
  const allControls = CONTROL_GROUPS.flatMap((g) => g.controls);

  const adminPerms: RolePermissions = {};
  const ownerPerms: RolePermissions = {};
  const customerPerms: RolePermissions = {};

  for (const ctrl of allControls) {
    // Admin sees and can action everything
    adminPerms[ctrl.id] = { visible: true, actionable: true };

    // ── Owner defaults ──────────────────────────────────────────
    // Owner can see booking steps, dashboard widgets, and notifications.
    // ALL action_* controls are Admin-only — owner gets no access.
    const ownerVisible =
      ctrl.id.startsWith("step_") ||
      ctrl.id.startsWith("widget_") ||
      ctrl.id.startsWith("notif_");
    // Owner cannot take any actionable role on action_* controls
    const ownerActionable =
      ownerVisible && !ctrl.id.startsWith("action_") &&
      (
        ctrl.id === "step_booking_confirmed" ||
        ctrl.id === "step_pre_delivery_inspection" ||
        ctrl.id === "step_outfit_dispatched" ||
        ctrl.id === "step_outfit_returned" ||
        ctrl.id === "step_post_return_inspection" ||
        ctrl.id.startsWith("notif_")
      );

    ownerPerms[ctrl.id] = {
      visible: ownerVisible,
      actionable: ownerActionable,
    };

    // ── Customer defaults ───────────────────────────────────────
    // Customer can see booking steps and relevant notifications only.
    // ALL action_* controls are Admin-only — customer gets no access.
    const customerVisible =
      ctrl.id.startsWith("step_") ||
      ctrl.id === "notif_booking_updates" ||
      ctrl.id === "notif_payment_receipts" ||
      ctrl.id === "notif_review_prompts";
    // Customer can only action the steps they physically perform
    const customerActionable =
      customerVisible && !ctrl.id.startsWith("action_") &&
      (
        ctrl.id === "step_outfit_delivered" ||
        ctrl.id === "step_return_pickup" ||
        ctrl.id === "notif_booking_updates" ||
        ctrl.id === "notif_payment_receipts" ||
        ctrl.id === "notif_review_prompts"
      );

    customerPerms[ctrl.id] = {
      visible: customerVisible,
      actionable: customerActionable,
    };
  }

  return { admin: adminPerms, owner: ownerPerms, customer: customerPerms };
}

const DEFAULT_PERMISSIONS = buildDefaultPermissions();
// Bump version suffix whenever defaults change to auto-flush stale localStorage.
const STORAGE_KEY = "shaadi_admin_customization_v2";

/* ── Role Tab Config ─────────────────────────────────────────── */
const ROLE_TABS: {
  key: RoleKey;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
  badge: string;
}[] = [
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    ring: "ring-rose-200 dark:ring-rose-800/60",
    badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300",
  },
  {
    key: "owner",
    label: "Owner",
    icon: Store,
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ring: "ring-violet-200 dark:ring-violet-800/60",
    badge: "bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-300",
  },
  {
    key: "customer",
    label: "Customer",
    icon: User,
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    ring: "ring-sky-200 dark:ring-sky-800/60",
    badge: "bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300",
  },
];

/* ── Toggle Switch ───────────────────────────────────────────── */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  color = "emerald",
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label: string;
  color?: "emerald" | "violet" | "sky" | "amber";
}) {
  const trackOn: Record<string, string> = {
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? trackOn[color] : "bg-stone-200 dark:bg-stone-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── Control Row ─────────────────────────────────────────────── */
function ControlRow({
  control,
  permission,
  onChange,
  roleColor,
}: {
  control: ControlItem;
  permission: ControlPermission;
  onChange: (id: ControlId, key: "visible" | "actionable", value: boolean) => void;
  roleColor: "emerald" | "violet" | "sky";
}) {
  const Icon = control.icon;

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
        permission.visible
          ? "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs hover:shadow-sm"
          : "border-stone-100 dark:border-stone-800/60 bg-stone-50/80 dark:bg-stone-900/40"
      }`}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            permission.visible
              ? "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-stone-200 dark:group-hover:bg-stone-700"
              : "bg-stone-100/60 dark:bg-stone-800/50 text-stone-300 dark:text-stone-600"
          }`}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold leading-tight transition-colors ${
              permission.visible ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-600"
            }`}
          >
            {control.label}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 leading-snug mt-0.5 truncate">
            {control.description}
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-5 shrink-0 pl-1 sm:pl-4">
        {/* Visible toggle */}
        <div className="flex items-center gap-2">
          {permission.visible ? (
            <Eye size={13} className="text-stone-400 dark:text-stone-500 shrink-0" />
          ) : (
            <EyeOff size={13} className="text-stone-300 dark:text-stone-600 shrink-0" />
          )}
          <ToggleSwitch
            checked={permission.visible}
            onChange={(val) => onChange(control.id, "visible", val)}
            label={`Toggle visibility of ${control.label}`}
            color={roleColor}
          />
          <span className="text-xs text-stone-400 dark:text-stone-500 w-12">
            {permission.visible ? "Visible" : "Hidden"}
          </span>
        </div>

        {/* Actionable toggle (only for controls that have actions) */}
        {control.hasAction && (
          <>
            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 shrink-0" />
            <div className="flex items-center gap-2">
              {permission.actionable ? (
                <Zap size={13} className="text-amber-500 shrink-0" />
              ) : (
                <ZapOff size={13} className="text-stone-300 dark:text-stone-600 shrink-0" />
              )}
              <ToggleSwitch
                checked={permission.actionable && permission.visible}
                onChange={(val) => onChange(control.id, "actionable", val)}
                disabled={!permission.visible}
                label={`Toggle action for ${control.label}`}
                color="amber"
              />
              <span className="text-xs text-stone-400 dark:text-stone-500 w-16 leading-tight">
                {permission.actionable && permission.visible ? "Can act" : "View only"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Collapsible Group ───────────────────────────────────────── */
function ControlGroupSection({
  group,
  roleKey,
  permissions,
  onChange,
  roleColor,
}: {
  group: ControlGroup;
  roleKey: RoleKey;
  permissions: RolePermissions;
  onChange: (id: ControlId, key: "visible" | "actionable", value: boolean) => void;
  roleColor: "emerald" | "violet" | "sky";
}) {
  const [open, setOpen] = useState(true);
  const GroupIcon = group.icon;

  const visibleCount = group.controls.filter((c) => permissions[c.id]?.visible).length;
  const total = group.controls.length;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs">
      {/* Group Header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
          <GroupIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{group.title}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
              {visibleCount}/{total} visible
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{group.subtitle}</p>
        </div>
        <div className="shrink-0 ml-2 text-stone-400 dark:text-stone-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Controls */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-stone-100 dark:border-stone-800">
          <div className="pt-3 space-y-2">
            {group.controls.map((control) => (
              <ControlRow
                key={control.id}
                control={control}
                permission={
                  permissions[control.id] ?? { visible: false, actionable: false }
                }
                onChange={onChange}
                roleColor={roleColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Role Summary Bar ────────────────────────────────────────── */
function RoleSummaryBar({
  permissions,
  roleTab,
}: {
  permissions: RolePermissions;
  roleTab: (typeof ROLE_TABS)[number];
}) {
  const allControls = CONTROL_GROUPS.flatMap((g) => g.controls);
  const visibleCount = allControls.filter((c) => permissions[c.id]?.visible).length;
  const actionableCount = allControls.filter(
    (c) => c.hasAction && permissions[c.id]?.actionable && permissions[c.id]?.visible
  ).length;
  const totalActionable = allControls.filter((c) => c.hasAction).length;
  const RoleIcon = roleTab.icon;

  return (
    <div
      className={`flex items-center gap-4 flex-wrap rounded-2xl border px-5 py-4 ${roleTab.bg} ring-1 ${roleTab.ring}`}
    >
      <div className={`flex items-center gap-2.5 ${roleTab.color}`}>
        <RoleIcon size={18} className="shrink-0" />
        <span className="text-sm font-bold">{roleTab.label} Role</span>
      </div>
      <div className="flex items-center gap-3 ml-auto flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
          <Eye size={13} />
          <span>
            <strong>{visibleCount}</strong> / {allControls.length} visible
          </span>
        </div>
        <div className="h-3.5 w-px bg-stone-300 dark:bg-stone-700" />
        <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
          <Zap size={13} className="text-amber-500" />
          <span>
            <strong>{actionableCount}</strong> / {totalActionable} actionable
          </span>
        </div>
        <div className="h-3.5 w-px bg-stone-300 dark:bg-stone-700" />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${roleTab.badge}`}
        >
          <Info size={10} />
          {roleTab.key === "admin"
            ? "Full Access by Default"
            : roleTab.key === "owner"
            ? "Boutique Controls"
            : "Renter Controls"}
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export function CustomizationClient() {
  const [activeRole, setActiveRole] = useState<RoleKey>("admin");
  const [permissions, setPermissions] = useState<PermissionsState>(DEFAULT_PERMISSIONS);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPermissions(JSON.parse(saved) as PermissionsState);
      }
    } catch {
      // Ignore
    }
    setHydrated(true);
  }, []);

  const handleChange = (
    id: ControlId,
    key: "visible" | "actionable",
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [id]: {
          ...prev[activeRole][id],
          [key]: value,
          // If hiding, also disable actionable
          ...(key === "visible" && !value ? { actionable: false } : {}),
        },
      },
    }));
  };

  const handleSave = () => {
    startTransition(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
      } catch {
        // Ignore storage errors
      }
      setTimeout(() => {
        toast.success("Customization settings saved successfully.", {
          description: "Role permissions have been updated across the platform.",
        });
      }, 300);
    });
  };

  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    toast.success("Permissions reset to platform defaults.");
  };

  const currentRoleTab = ROLE_TABS.find((r) => r.key === activeRole)!;
  const roleColorMap: Record<RoleKey, "emerald" | "violet" | "sky"> = {
    admin: "emerald",
    owner: "violet",
    customer: "sky",
  };

  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-fit">
        {ROLE_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeRole === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveRole(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? `bg-white dark:bg-stone-800 shadow-sm ring-1 ${tab.ring} ${tab.color}`
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/60"
              }`}
            >
              <TabIcon size={15} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Summary */}
      <RoleSummaryBar
        permissions={permissions[activeRole]}
        roleTab={currentRoleTab}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-100 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-900/60 px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <Eye size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong className="text-stone-700 dark:text-stone-300">Visible</strong> — The step/widget appears
            in the UI
          </span>
        </div>
        <div className="hidden sm:block h-3 w-px bg-stone-300 dark:bg-stone-700" />
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-amber-500 dark:text-amber-400" />
          <span>
            <strong className="text-stone-700 dark:text-stone-300">Actionable</strong> — The role can
            click/trigger this control
          </span>
        </div>
        <div className="hidden sm:block h-3 w-px bg-stone-300 dark:bg-stone-700" />
        <div className="flex items-center gap-1.5">
          <Palette size={12} className="text-violet-500 dark:text-violet-400" />
          <span>Changes take effect immediately after saving</span>
        </div>
      </div>

      {/* Control Groups */}
      <div className="space-y-4">
        {CONTROL_GROUPS.map((group) => (
          <ControlGroupSection
            key={group.id}
            group={group}
            roleKey={activeRole}
            permissions={permissions[activeRole]}
            onChange={handleChange}
            roleColor={roleColorMap[activeRole]}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-6">
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Reset All to Defaults
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {isPending ? "Saving…" : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}
