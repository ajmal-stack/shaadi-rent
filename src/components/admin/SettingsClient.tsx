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
} from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, AdminThemeToggle } from "./AdminThemeProvider";

interface SettingsState {
  // Fees
  platformCommissionPercent: number;
  securityDepositMultiplier: number;
  cancellationWindowHours: number;
  minBookingDaysInAdvance: number;
  
  // Payments
  paymentProvider: "razorpay" | "stripe";
  escrowReleaseBufferDays: number;
  autoRefundEnabled: boolean;
  webhookStatus: "active" | "failing";

  // Security
  mandatoryKycThreshold: number;
  enforceAdmin2FA: boolean;
  sessionTimeoutMinutes: number;

  // Notifications
  smsBookingAlerts: boolean;
  emailDisputeAlerts: boolean;
  dailyDigestAdmin: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  platformCommissionPercent: 15,
  securityDepositMultiplier: 1.0,
  cancellationWindowHours: 48,
  minBookingDaysInAdvance: 2,
  paymentProvider: "razorpay",
  escrowReleaseBufferDays: 2,
  autoRefundEnabled: true,
  webhookStatus: "active",
  mandatoryKycThreshold: 5000,
  enforceAdmin2FA: true,
  sessionTimeoutMinutes: 60,
  smsBookingAlerts: true,
  emailDisputeAlerts: true,
  dailyDigestAdmin: false,
};

type TabType = "general" | "payments" | "security" | "notifications" | "appearance";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme, resolvedTheme } = useAdminTheme();

  const handleSave = () => {
    startTransition(() => {
      // Simulate save
      setTimeout(() => {
        toast.success("Platform settings updated successfully");
      }, 400);
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.success("Settings restored to default configuration");
  };

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "general"
              ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
              : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Sliders size={16} />
          General & Fees
        </button>
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "appearance"
              ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
              : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Palette size={16} />
          Appearance & Theme
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "payments"
              ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
              : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <CreditCard size={16} />
          Payment Gateway & Escrow
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "security"
              ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
              : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Lock size={16} />
          Identity & Security
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 font-semibold"
              : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Bell size={16} />
          Notifications
        </button>
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
                Customize the visual presentation of your administrative workspace. Switch between light, luxury dark, or auto system detection.
              </p>
            </div>

            {/* Theme Switcher Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`group text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  theme === "light"
                    ? "border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                    : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600">
                      <Sun size={20} />
                    </div>
                    {theme === "light" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm mt-3">
                    Light Theme
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Crisp alabaster background with clean borders, ideal for bright workspaces.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Bright & Clean</span>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`group text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  theme === "dark"
                    ? "border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                    : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-800 border border-stone-700 flex items-center justify-center text-rose-400">
                      <Moon size={20} />
                    </div>
                    {theme === "dark" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm mt-3">
                    Dark Theme
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Luxury obsidian and stone palette designed to reduce eye strain during evening reviews.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Obsidian Noir</span>
                </div>
              </button>

              {/* System Auto Card */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`group text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  theme === "system"
                    ? "border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                    : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <Monitor size={20} />
                    </div>
                    {theme === "system" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm mt-3">
                    System Preference
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Automatically align with your operating system&apos;s active dark or light preference.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Auto-Synchronized</span>
                </div>
              </button>
            </div>

            {/* Quick Toggle Controls & Shortcut Advice */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Quick Keyboard Shortcut</span>
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  You can press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[11px] font-mono text-stone-800 dark:text-stone-200 shadow-2xs">Ctrl + Shift + D</kbd> (or Cmd on Mac) at any time to instantly switch between Light and Dark mode.
                </p>
              </div>

              <AdminThemeToggle variant="pill" />
            </div>
          </div>
        )}

        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Rental Fee Structure</h3>
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
                    type="number"
                    min="0"
                    max="50"
                    value={settings.platformCommissionPercent}
                    onChange={(e) =>
                      setSettings({ ...settings, platformCommissionPercent: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
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
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={settings.securityDepositMultiplier}
                    onChange={(e) =>
                      setSettings({ ...settings, securityDepositMultiplier: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
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
                  type="number"
                  min="0"
                  max="168"
                  value={settings.cancellationWindowHours}
                  onChange={(e) =>
                    setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Renters receive full refund if cancelled within this window.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Minimum Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.minBookingDaysInAdvance}
                  onChange={(e) =>
                    setSettings({ ...settings, minBookingDaysInAdvance: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Preparation and dry-cleaning lead time before event start.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Payment Gateway & Escrow Settlement</h3>
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
                  value={settings.paymentProvider}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentProvider: e.target.value as "razorpay" | "stripe",
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
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
                  type="number"
                  min="1"
                  max="14"
                  value={settings.escrowReleaseBufferDays}
                  onChange={(e) =>
                    setSettings({ ...settings, escrowReleaseBufferDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Days after return inspection before deposit is automatically unlocked.</p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Automatic Refund Processing</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Auto-trigger Razorpay refund on approved dispute settlements.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefundEnabled}
                onChange={(e) => setSettings({ ...settings, autoRefundEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Identity Verification & Access Governance</h3>
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
                  type="number"
                  step="500"
                  min="1000"
                  max="50000"
                  value={settings.mandatoryKycThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, mandatoryKycThreshold: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Renters must submit government ID for bookings above this value.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Admin Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Inactivity duration before automatic re-authentication is required.</p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Require OTP code for all admin console logins.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforceAdmin2FA}
                onChange={(e) => setSettings({ ...settings, enforceAdmin2FA: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">System Alerts & Communications</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Toggle SMS and Email delivery for critical platform events.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">SMS Booking Notifications</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Send transactional SMS alerts for confirmed bookings and pickup reminders.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsBookingAlerts}
                onChange={(e) => setSettings({ ...settings, smsBookingAlerts: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Dispute Escalation Emails</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Instant notification to admin mailbox when a new dispute or claim is raised.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailDisputeAlerts}
                onChange={(e) => setSettings({ ...settings, emailDisputeAlerts: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Daily Operations Digest</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Send daily summary of pending verifications, new rentals, and inspection alerts.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyDigestAdmin}
                onChange={(e) => setSettings({ ...settings, dailyDigestAdmin: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-6 mt-6">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white transition-colors shadow-xs"
          >
            <Save size={14} />
            {isPending ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

