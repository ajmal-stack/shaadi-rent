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
} from "lucide-react";
import { toast } from "sonner";

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

type TabType = "general" | "payments" | "security" | "notifications";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isPending, startTransition] = useTransition();

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
      <div className="flex border-b border-stone-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "general"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Sliders size={16} />
          General & Fees
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "payments"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <CreditCard size={16} />
          Payment Gateway & Escrow
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "security"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Lock size={16} />
          Identity & Security
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Bell size={16} />
          Notifications
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-semibold text-stone-900">Rental Fee Structure</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure commission percentages and deposit calculations for all boutique bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <Percent size={14} className="absolute right-3.5 top-3.5 text-stone-400" />
                </div>
                <p className="text-xs text-stone-400 mt-1">Deducted from owner rental earnings upon completion.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-stone-400 font-semibold">× Rental</span>
                </div>
                <p className="text-xs text-stone-400 mt-1">Default 1.0× (100% of rental amount held in escrow).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-stone-400 mt-1">Renters receive full refund if cancelled within this window.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-stone-400 mt-1">Preparation and dry-cleaning lead time before event start.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-semibold text-stone-900">Payment Gateway & Escrow Settlement</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage transactions, webhook integrations, and escrow release timelines.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="razorpay">Razorpay (India UPI / Cards / NetBanking)</option>
                  <option value="stripe">Stripe (International & Cards)</option>
                </select>
                <p className="text-xs text-stone-400 mt-1">Handles customer checkout and instant webhook callbacks.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-stone-400 mt-1">Days after return inspection before deposit is automatically unlocked.</p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Automatic Refund Processing</p>
                <p className="text-xs text-stone-500">Auto-trigger Razorpay refund on approved dispute settlements.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefundEnabled}
                onChange={(e) => setSettings({ ...settings, autoRefundEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-semibold text-stone-900">Identity Verification & Access Governance</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                KYC threshold limits and platform administrative security parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-stone-400 mt-1">Renters must submit government ID for bookings above this value.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
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
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-stone-400 mt-1">Inactivity duration before automatic re-authentication is required.</p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-stone-500">Require OTP code for all admin console logins.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforceAdmin2FA}
                onChange={(e) => setSettings({ ...settings, enforceAdmin2FA: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-semibold text-stone-900">System Alerts & Communications</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Toggle SMS and Email delivery for critical platform events.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">SMS Booking Notifications</p>
                <p className="text-xs text-stone-500">Send transactional SMS alerts for confirmed bookings and pickup reminders.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsBookingAlerts}
                onChange={(e) => setSettings({ ...settings, smsBookingAlerts: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Dispute Escalation Emails</p>
                <p className="text-xs text-stone-500">Instant notification to admin mailbox when a new dispute or claim is raised.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailDisputeAlerts}
                onChange={(e) => setSettings({ ...settings, emailDisputeAlerts: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Daily Operations Digest</p>
                <p className="text-xs text-stone-500">Send daily summary of pending verifications, new rentals, and inspection alerts.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyDigestAdmin}
                onChange={(e) => setSettings({ ...settings, dailyDigestAdmin: e.target.checked })}
                className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-6 mt-6">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Save size={14} />
            {isPending ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
