"use client";

import { useState, useTransition } from "react";
import {
  Settings,
  Percent,
  CreditCard,
  Shield,
  Bell,
  Save,
  RotateCcw,
  Sliders,
  Lock,
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, AdminThemeToggle } from "./AdminThemeProvider";
import { updateSettings } from "@/app/(admin)/admin/settings/actions";
import { DEFAULT_SETTINGS } from "@/app/(admin)/admin/settings/settings.config";
import type { PlatformSettings } from "@/app/(admin)/admin/settings/settings.config";

// ── Types ────────────────────────────────────────────────────────────────────

type TabType = "general" | "payments" | "security" | "notifications" | "appearance";

interface SettingsClientProps {
  initialSettings: PlatformSettings;
}

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<PlatformSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useAdminTheme();

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // ── Save Handler ────────────────────────────────────────────────────────────
  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettings(settings);
      if (result.success) {
        setSavedSettings(settings);
        toast.success("Settings saved successfully", {
          description: "Platform configuration updated in database.",
          icon: <CheckCircle2 size={16} className="text-emerald-500" />,
        });
      } else {
        toast.error("Failed to save settings", {
          description: result.error ?? "Please try again.",
        });
      }
    });
  };

  // ── Reset Handler ───────────────────────────────────────────────────────────
  const handleReset = () => {
    setSettings(savedSettings); // Reset to last saved state, not defaults
    toast.info("Changes discarded", {
      description: "Reverted to last saved configuration.",
    });
  };

  // ── Full Reset to Defaults ──────────────────────────────────────────────────
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info("Default values loaded", {
      description: "Click 'Save Configuration' to apply them.",
    });
  };

  // ── Tab Button Component ────────────────────────────────────────────────────
  const TabButton = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: TabType;
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
        activeTab === tab
          ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
          : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  // ── Input Classes ───────────────────────────────────────────────────────────
  const inputClass =
    "w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors";

  const toggleRowClass =
    "rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between gap-4";

  return (
    <div className="space-y-6">

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            You have unsaved changes in this tab
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isPending}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {isPending ? "Saving…" : "Save Now"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-2">
        <TabButton tab="general"       icon={Sliders}     label="General & Fees" />
        <TabButton tab="appearance"    icon={Palette}     label="Appearance & Theme" />
        <TabButton tab="payments"      icon={CreditCard}  label="Payment Gateway & Escrow" />
        <TabButton tab="security"      icon={Lock}        label="Identity & Security" />
        <TabButton tab="notifications" icon={Bell}        label="Notifications" />
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-6">

        {/* ── Appearance Tab ── */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Palette size={18} className="text-rose-600 dark:text-rose-400" />
                <span>Admin Console Appearance & Theme</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Customize the visual presentation of your administrative workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["light", "dark", "system"] as const).map((t) => {
                const meta = {
                  light:  { Icon: Sun,     label: "Light Theme",       desc: "Crisp alabaster background, ideal for bright workspaces.",    accent: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500",  tag: "Bright & Clean" },
                  dark:   { Icon: Moon,    label: "Dark Theme",        desc: "Luxury obsidian palette designed to reduce eye strain.",      accent: "text-rose-600 dark:text-rose-400",   dot: "bg-rose-500",   tag: "Obsidian Noir" },
                  system: { Icon: Monitor, label: "System Preference", desc: "Automatically align with your OS dark/light preference.",    accent: "text-sky-600 dark:text-sky-400",     dot: "bg-sky-500",    tag: "Auto-Synchronized" },
                }[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      theme === t
                        ? "border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                        : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center">
                          <meta.Icon size={20} className={meta.accent} />
                        </div>
                        {theme === t && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs">✓</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm mt-3">{meta.label}</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{meta.desc}</p>
                    </div>
                    <div className={`mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 text-[11px] font-bold ${meta.accent}`}>
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span>{meta.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Quick Keyboard Shortcut</span>
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[11px] font-mono text-stone-800 dark:text-stone-200 shadow-2xs">
                    Ctrl + Shift + D
                  </kbd>{" "}
                  to instantly toggle Dark / Light mode.
                </p>
              </div>
              <AdminThemeToggle variant="pill" />
            </div>
          </div>
        )}

        {/* ── General & Fees Tab ── */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Settings size={18} className="text-rose-600 dark:text-rose-400" />
                Rental Fee Structure
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Configure commission percentages and deposit calculations for all boutique bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Platform Commission (%)
                </label>
                <div className="relative">
                  <input
                    type="number" min="0" max="50"
                    value={settings.commission_percent}
                    onChange={(e) => setSettings({ ...settings, commission_percent: Number(e.target.value) })}
                    className={inputClass}
                  />
                  <Percent size={14} className="absolute right-3.5 top-3.5 text-stone-400" />
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Deducted from owner rental earnings upon completion.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Security Deposit Ratio
                </label>
                <div className="relative">
                  <input
                    type="number" step="0.1" min="0.5" max="3.0"
                    value={settings.security_deposit_multiplier}
                    onChange={(e) => setSettings({ ...settings, security_deposit_multiplier: Number(e.target.value) })}
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-stone-400 font-semibold">× Rental</span>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Default 1.0× (100% of rental amount held in escrow).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Cancellation Grace Period (Hours)
                </label>
                <input
                  type="number" min="0" max="168"
                  value={settings.cancellation_window_hours}
                  onChange={(e) => setSettings({ ...settings, cancellation_window_hours: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Renters receive full refund if cancelled within this window.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Minimum Advance Booking (Days)
                </label>
                <input
                  type="number" min="1" max="14"
                  value={settings.min_booking_days_advance}
                  onChange={(e) => setSettings({ ...settings, min_booking_days_advance: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Preparation and dry-cleaning lead time before event start.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Payment Gateway & Escrow Tab ── */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CreditCard size={18} className="text-rose-600 dark:text-rose-400" />
                Payment Gateway & Escrow Settlement
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Manage transactions, webhook integrations, and escrow release timelines.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Primary Gateway
                </label>
                <select
                  value={settings.payment_provider}
                  onChange={(e) => setSettings({ ...settings, payment_provider: e.target.value as "razorpay" | "stripe" })}
                  className={inputClass}
                >
                  <option value="razorpay">Razorpay (India UPI / Cards / NetBanking)</option>
                  <option value="stripe">Stripe (International & Cards)</option>
                </select>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Handles customer checkout and instant webhook callbacks.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Escrow Release Buffer (Days)
                </label>
                <input
                  type="number" min="1" max="14"
                  value={settings.escrow_release_buffer_days}
                  onChange={(e) => setSettings({ ...settings, escrow_release_buffer_days: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Days after return inspection before deposit is automatically unlocked.</p>
              </div>
            </div>

            <div className={toggleRowClass}>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Automatic Refund Processing</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Auto-trigger Razorpay refund on approved dispute settlements.</p>
              </div>
              <ToggleSwitch
                checked={settings.auto_refund_enabled}
                onChange={(v) => setSettings({ ...settings, auto_refund_enabled: v })}
              />
            </div>
          </div>
        )}

        {/* ── Identity & Security Tab ── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Shield size={18} className="text-rose-600 dark:text-rose-400" />
                Identity Verification & Access Governance
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                KYC threshold limits and platform administrative security parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Mandatory KYC Threshold (₹)
                </label>
                <input
                  type="number" step="500" min="1000" max="50000"
                  value={settings.mandatory_kyc_threshold}
                  onChange={(e) => setSettings({ ...settings, mandatory_kyc_threshold: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Renters must submit government ID for bookings above this value.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Admin Session Timeout (Minutes)
                </label>
                <input
                  type="number" min="15" max="480"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Inactivity duration before automatic re-authentication is required.</p>
              </div>
            </div>

            <div className={toggleRowClass}>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Require OTP code for all admin console logins.</p>
              </div>
              <ToggleSwitch
                checked={settings.enforce_admin_2fa}
                onChange={(v) => setSettings({ ...settings, enforce_admin_2fa: v })}
              />
            </div>
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Bell size={18} className="text-rose-600 dark:text-rose-400" />
                System Alerts & Communications
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Toggle SMS and email delivery for critical platform events.
              </p>
            </div>

            <div className={toggleRowClass}>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">SMS Booking Notifications</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Send transactional SMS alerts for confirmed bookings and pickup reminders.</p>
              </div>
              <ToggleSwitch
                checked={settings.sms_booking_alerts}
                onChange={(v) => setSettings({ ...settings, sms_booking_alerts: v })}
              />
            </div>

            <div className={toggleRowClass}>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Dispute Escalation Emails</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Instant notification to admin mailbox when a new dispute or claim is raised.</p>
              </div>
              <ToggleSwitch
                checked={settings.email_dispute_alerts}
                onChange={(v) => setSettings({ ...settings, email_dispute_alerts: v })}
              />
            </div>

            <div className={toggleRowClass}>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Daily Operations Digest</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Send daily summary of pending verifications, new rentals, and inspection alerts.</p>
              </div>
              <ToggleSwitch
                checked={settings.daily_digest_admin}
                onChange={(v) => setSettings({ ...settings, daily_digest_admin: v })}
              />
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        {activeTab !== "appearance" && (
          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-6 mt-6 gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RotateCcw size={14} />
              Load Defaults
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                hasChanges && !isPending
                  ? "text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white"
                  : "text-stone-400 dark:text-stone-600 bg-stone-100 dark:bg-stone-800 cursor-not-allowed"
              }`}
            >
              <Save size={14} />
              {isPending ? "Saving…" : hasChanges ? "Save Configuration" : "Saved ✓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ToggleSwitch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${
        checked ? "bg-rose-600" : "bg-stone-200 dark:bg-stone-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
