"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  LogOut,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FileText,
  Building,
  Gift,
  Crown,
  Bell,
  Check,
  Copy,
  AlertCircle,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { ProfileData, BookingSummary } from "./ProfileClient";
import type { NotificationPreferences } from "@/app/(customer)/account/actions";
import { signOut } from "@/app/(public)/auth/actions";

interface MobileProfileViewProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  bookings: BookingSummary[];
  outfitCount: number;
  initials: string;
  memberSince: string;
  activeBookingsCount: number;

  // Form states and handlers
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  selectedState: string;
  setSelectedState: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  isEditingAvatar: boolean;
  setIsEditingAvatar: (val: boolean | ((prev: boolean) => boolean)) => void;
  avatarInput: string;
  setAvatarInput: (val: string) => void;
  handleSaveAvatar: () => void;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;

  // Password
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (val: boolean | ((p: boolean) => boolean)) => void;
  showNewPassword: boolean;
  setShowNewPassword: (val: boolean | ((p: boolean) => boolean)) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean | ((p: boolean) => boolean)) => void;
  isChangingPassword: boolean;
  hasPasswordAccount: boolean;
  isGoogleAccount: boolean;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;

  // Notification prefs
  notificationPrefs: NotificationPreferences;
  toggleNotificationPref: (key: keyof NotificationPreferences) => void;
  handleSaveNotificationPrefs: (e?: React.FormEvent) => Promise<void>;
  isSavingPrefs: boolean;

  // Delete modal
  setDeleteModalOpen: (open: boolean) => void;
}

type ActiveSection =
  | null
  | "personal"
  | "bookings"
  | "payment"
  | "address"
  | "notifications"
  | "security"
  | "support"
  | "vouchers"
  | "referral"
  | "subscription"
  | "policies"
  | "company";

export function MobileProfileView({
  profile,
  setProfile,
  bookings,
  outfitCount,
  initials,
  memberSince,
  activeBookingsCount,
  fullName,
  setFullName,
  phone,
  setPhone,
  city,
  setCity,
  district,
  setDistrict,
  selectedState,
  setSelectedState,
  avatarUrl,
  setAvatarUrl,
  isEditingAvatar,
  setIsEditingAvatar,
  avatarInput,
  setAvatarInput,
  handleSaveAvatar,
  handleSaveProfile,
  isPending,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isChangingPassword,
  hasPasswordAccount,
  isGoogleAccount,
  handleChangePassword,
  notificationPrefs,
  toggleNotificationPref,
  handleSaveNotificationPrefs,
  isSavingPrefs,
  setDeleteModalOpen,
}: MobileProfileViewProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // ── Render Drawer Sub-views ──────────────────────────────────────────────
  if (activeSection !== null) {
    return (
      <div className="min-h-screen bg-[#f7fafb] pb-24 text-gray-900 animate-in fade-in slide-in-from-right-4 duration-200">
        {/* Sticky Mobile Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900 capitalize">
            {activeSection === "personal" && "Personal Information"}
            {activeSection === "bookings" && "My Rentals & Bookings"}
            {activeSection === "payment" && "Payments & Security Deposit"}
            {activeSection === "address" && "Saved Fitting Address"}
            {activeSection === "notifications" && "Notification Settings"}
            {activeSection === "security" && "Login & Security"}
            {activeSection === "support" && "Help & Concierge"}
            {activeSection === "vouchers" && "Wedding Vouchers & Offers"}
            {activeSection === "referral" && "Refer a Friend"}
            {activeSection === "subscription" && "VIP Bridal Club Pass"}
            {activeSection === "policies" && "Terms & Policies"}
            {activeSection === "company" && "About ShaadiRent"}
          </h2>
          <div className="w-9" />
        </div>

        <div className="p-4 space-y-4 max-w-md mx-auto">
          {/* 1. PERSONAL INFORMATION */}
          {activeSection === "personal" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-4">
                <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
                  <div className="relative">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-[#00a896]"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#00a896] to-[#028090] text-xl font-bold text-white shadow-sm">
                        {initials}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingAvatar((p) => !p)}
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#00a896] text-white shadow ring-2 ring-white"
                      title="Edit photo"
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {fullName || "User Profile"}
                    </h3>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} />
                      Verified Member
                    </span>
                  </div>
                </div>

                {isEditingAvatar && (
                  <div className="rounded-2xl bg-gray-50 p-3 space-y-2 border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700">
                      Profile Photo Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAvatar}
                        className="rounded-lg bg-[#00a896] px-3 py-1 text-xs font-bold text-white"
                      >
                        Set Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAvatar(false)}
                        className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      WhatsApp Mobile Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 px-3 text-xs font-semibold text-gray-600">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="w-full rounded-r-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Delhi, Lucknow"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. South Delhi, Bandra"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00a896] to-[#028090] py-3 text-xs font-bold text-white shadow-md active:scale-98 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isPending ? "Saving Details…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. RENTAL BOOKINGS */}
          {activeSection === "bookings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-gray-500">
                  {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} recorded
                </p>
                <Link
                  href="/bookings"
                  className="text-xs font-bold text-[#00a896] hover:underline inline-flex items-center gap-1"
                >
                  Full Bookings Page <ChevronRight size={13} />
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-3xl bg-white p-8 text-center space-y-3 border border-gray-100 shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#00a896]">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    No Rental Bookings Yet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Explore designer bridal lehengas, groom sherwanis, and luxury reception wear.
                  </p>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-[#00a896] px-5 py-2.5 text-xs font-bold text-white shadow-xs"
                  >
                    <span>Browse Outfits</span>
                  </Link>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-3xl bg-white p-4.5 shadow-xs border border-gray-100 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#00a896] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                          #{booking.booking_number}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm mt-1">
                          {booking.outfit_title || "Designer Bridal Outfit"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-50">
                      <p>
                        Rental: {new Date(booking.rental_start_date).toLocaleDateString("en-IN")} —{" "}
                        {new Date(booking.rental_end_date).toLocaleDateString("en-IN")}
                      </p>
                      <p className="font-bold text-gray-900 text-sm pt-1">
                        ₹{booking.total_amount.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <Link
                      href="/bookings"
                      className="block text-center rounded-xl bg-gray-50 hover:bg-gray-100 py-2 text-xs font-semibold text-gray-700 transition-colors"
                    >
                      Track Delivery &amp; Fitment
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. PAYMENTS & SECURITY DEPOSIT */}
          {activeSection === "payment" && (
            <div className="space-y-4">
              {/* Escrow Banner */}
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#00a896] border border-teal-100">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      100% Escrow Deposit Protection
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Transparent &amp; insured rental security
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-teal-50/70 p-4 border border-teal-100/90 text-xs text-teal-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-teal-800">
                    <CheckCircle2 size={15} className="text-[#00a896]" />
                    Automatic Deposit Refund Guarantee
                  </p>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Security deposits are locked safely in escrow and automatically refunded to your original payment method within 48 hours of outfit return inspection.
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">
                  Accepted Payment Modes
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="font-medium">UPI / GPay / PhonePe / Paytm</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Instant</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="font-medium">Cards (Visa, MasterCard, RuPay)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Secure 3DS</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="font-medium">Net Banking &amp; No-Cost EMI</span>
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Available</span>
                  </div>
                </div>
              </div>

              {/* Quick links to Address & Bookings */}
              <div className="rounded-3xl bg-white p-4 shadow-xs border border-gray-100 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveSection("address")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-[#00a896]" />
                    <span className="text-xs font-semibold text-gray-800">Saved Fitting &amp; Delivery Address</span>
                  </div>
                  <ChevronRight size={15} className="text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("bookings")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[#00a896]" />
                    <span className="text-xs font-semibold text-gray-800">Rental Bookings &amp; Invoices</span>
                  </div>
                  <ChevronRight size={15} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* 4. SAVED ADDRESS & FITTING LOCATION */}
          {activeSection === "address" && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00a896]">
                    <MapPin size={16} />
                    <span>Primary Fitting &amp; Delivery Address</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                    Default
                  </span>
                </div>

                <div className="text-xs text-gray-700 space-y-1 bg-[#f7fafb] p-4 rounded-2xl border border-gray-100">
                  <p className="font-bold text-sm text-gray-900">
                    {profile.full_name || "Name not set"}
                  </p>
                  <p>
                    {profile.city || "City not set"}
                    {profile.district ? `, ${profile.district}` : ""}
                  </p>
                  <p>{profile.state || "State not set"}, India</p>
                  <p className="text-gray-500 pt-1 font-mono">
                    Phone: {profile.phone ? `+91 ${profile.phone}` : "Not provided"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSection("personal")}
                  className="w-full rounded-2xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-800 text-center transition-colors"
                >
                  Edit Address Details
                </button>
              </div>

              <div className="rounded-3xl bg-emerald-50/70 p-4 border border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Free Doorstep Trial Available
                </p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Our logistics team verifies pin-code serviceability before shipping couture lehengas and sherwanis with full transit insurance.
                </p>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <div className="space-y-3">
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Alert Preferences
                    </h3>
                    <p className="text-xs text-gray-500">
                      Stay updated on bookings &amp; trials
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSavingPrefs}
                    onClick={() => handleSaveNotificationPrefs()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00a896] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    {isSavingPrefs ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    <span>{isSavingPrefs ? "Saving…" : "Save"}</span>
                  </button>
                </div>

                {/* Toggles */}
                {[
                  {
                    key: "whatsapp_updates" as const,
                    title: "WhatsApp Updates",
                    desc: "Invoices, fitting schedules, and courier tracking",
                  },
                  {
                    key: "sms_alerts" as const,
                    title: "SMS Alerts",
                    desc: "Return pickup OTPs and courier phone alerts",
                  },
                  {
                    key: "email_bookings" as const,
                    title: "Email Receipts",
                    desc: "Deposit statements and booking confirmations",
                  },
                  {
                    key: "promotions" as const,
                    title: "Festive Promos & Drops",
                    desc: "Exclusive discounts on Sabyasachi & Manish Malhotra",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{item.title}</h4>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotificationPref(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        notificationPrefs[item.key] ? "bg-[#00a896]" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notificationPrefs[item.key]}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPrefs[item.key] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. LOGIN & SECURITY */}
          {activeSection === "security" && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {hasPasswordAccount ? "Change Password" : "Create Account Password"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Keep your wedding rental transactions safe.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  {hasPasswordAccount && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 pr-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      New Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 pr-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 pr-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full rounded-2xl bg-[#00a896] hover:bg-[#028090] py-2.5 text-xs font-bold text-white shadow-xs active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="rounded-3xl bg-rose-50/70 p-4 border border-rose-200/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-rose-950 text-xs">Delete Account</h4>
                  <p className="text-[11px] text-rose-700">Permanent data erasure</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="rounded-xl bg-white border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* 6. SUPPORT & CONCIERGE */}
          {activeSection === "support" && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#00a896]">
                  <MessageCircle size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    ShaadiRent Concierge Desk
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Available 9:00 AM – 9:00 PM for bridal measurements, courier dispatch, and deposit assistance.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href="https://wa.me/918228805415?text=Hello%20ShaadiRent%2C%20I%20need%20help%20with%20my%20rental%20profile"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#25D366] py-3 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all"
                  >
                    <MessageCircle size={16} />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href="tel:+918228805415"
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gray-100 py-3 text-xs font-bold text-gray-800 hover:bg-gray-200 transition-all"
                  >
                    <Phone size={15} />
                    <span>Call Concierge: +91 8228805415</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 7. VOUCHERS */}
          {activeSection === "vouchers" && (
            <div className="space-y-3">
              {[
                {
                  code: "ROYALBRIDE",
                  title: "Flat ₹1,500 Off Bridal Lehengas",
                  desc: "Valid on rentals above ₹9,999. Includes free trial.",
                },
                {
                  code: "FIRSTRENT",
                  title: "15% Off First Rental",
                  desc: "Special welcome reward for new brides and grooms.",
                },
                {
                  code: "WEDDINGPASS",
                  title: "Free Return Dry-Cleaning",
                  desc: "Zero deduction dry-cleaning voucher on all couture sets.",
                },
              ].map((voucher) => (
                <div
                  key={voucher.code}
                  className="rounded-3xl bg-white p-4.5 shadow-xs border border-teal-100/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#00a896] bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                      {voucher.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(voucher.code)}
                      className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-teal-50 hover:text-[#00a896]"
                    >
                      {copiedCode === voucher.code ? (
                        <>
                          <Check size={12} className="text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs">{voucher.title}</h4>
                  <p className="text-[11px] text-gray-500">{voucher.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* 8. REFER A FRIEND */}
          {activeSection === "referral" && (
            <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Gift size={32} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Refer a Bride or Groom
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Share your referral link. When they book their wedding wear, you both get ₹1,000 ShaadiRent rental credits!
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-800">
                  SHAADI-AJMAL2025
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("SHAADI-AJMAL2025")}
                  className="rounded-xl bg-[#00a896] text-white px-3 py-1.5 text-xs font-bold"
                >
                  {copiedCode === "SHAADI-AJMAL2025" ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>
          )}

          {/* 9. SUBSCRIPTION / VIP BRIDAL PASS */}
          {activeSection === "subscription" && (
            <div className="rounded-3xl bg-gradient-to-br from-[#00a896]/10 to-[#028090]/15 p-6 border border-teal-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#00a896] text-white px-2.5 py-0.5 text-[10px] font-bold">
                  VIP Club
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  ShaadiRent Bridal Club
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Enjoy zero security deposit on select lehengas, guaranteed doorstep tailor fitments, and priority delivery for entire wedding families.
              </p>
              <ul className="text-xs space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00a896]" />
                  <span>0% Security Deposit on verified bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00a896]" />
                  <span>Complimentary Doorstep Blouse &amp; Length Fitment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00a896]" />
                  <span>Personal Wedding Stylist Consultation</span>
                </li>
              </ul>
            </div>
          )}

          {/* 10. POLICIES */}
          {activeSection === "policies" && (
            <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-4 text-xs text-gray-600">
              <h3 className="font-bold text-gray-900 text-sm">
                Rental Agreement &amp; Damage Protection
              </h3>
              <p className="leading-relaxed">
                Every outfit on ShaadiRent is insured against minor accidental stains, seam loose stitching, and zip issues.
              </p>
              <h4 className="font-bold text-gray-800 text-xs pt-1">Deposit &amp; Return Policy</h4>
              <p className="leading-relaxed">
                Security deposits are held in escrow and released within 48 hours of return pickup inspection.
              </p>
              <h4 className="font-bold text-gray-800 text-xs pt-1">Cancellations</h4>
              <p className="leading-relaxed">
                Free cancellation up to 14 days before the rental start date with 100% full refund.
              </p>
            </div>
          )}

          {/* 11. COMPANY */}
          {activeSection === "company" && (
            <div className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 space-y-3 text-xs text-gray-600 text-center">
              <h3 className="font-bold text-gray-900 text-base">
                ShaadiRent India
              </h3>
              <p className="text-gray-500">
                India&apos;s Premier Wedding &amp; Couture Rental Network.
              </p>
              <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100">
                Version 2.4.0 • Made with ❤️ for Indian Weddings
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render Main Mobile Profile Hub (Screenshot Layout) ───────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f7f8] via-[#f1f9fa] to-[#f8fbfb] pb-24 text-gray-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* ── 1. TOP PROFILE HEADER ────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 pt-1">
          {/* Avatar with Ring & Verification Badge */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={profile.full_name || "Profile"}
                width={60}
                height={60}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-[#00a896] shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#38b2ac] to-[#00a896] text-xl font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
            {/* Round info/check badge at bottom right corner (from screenshot) */}
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white shadow-xs text-[10px] font-bold">
              i
            </div>
          </div>

          {/* Name & Phone Number */}
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setActiveSection("personal")}
              className="group flex items-center gap-1.5 text-left active:opacity-80 transition-opacity"
            >
              <h1 className="font-bold text-lg text-gray-900 tracking-tight truncate">
                {profile.full_name || "Ajmal Hissain"}
              </h1>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-gray-700 transition-colors shrink-0"
              />
            </button>
            <p className="text-xs text-gray-500 font-mono tracking-tight mt-0.5">
              {profile.phone ? `+91${profile.phone}` : "+918228805415"}
            </p>
          </div>
        </div>

        {/* ── 2. EMAIL / KYC VERIFICATION NOTICE BANNER ────────────────────── */}
        <button
          type="button"
          onClick={() => setActiveSection("personal")}
          className="w-full text-left rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-3.5 hover:shadow-md transition-all active:scale-[0.99]"
        >
          {/* 3D Envelope Badge Graphic */}
          <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-50 via-teal-50 to-indigo-50 border border-teal-100/60 shadow-xs">
            <svg
              className="h-7 w-7 text-[#00a896]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="3" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <path d="M12 12v3" stroke="#00a896" strokeWidth="2" />
              <path d="M10.5 13.5 12 15l2.5-2.5" stroke="#00a896" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h3 className="font-bold text-gray-900 text-xs leading-snug">
              Email verification
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
              You may use this email to receive invoices and recover your account.
            </p>
          </div>
        </button>

        {/* ── 3. DUAL LARGE FEATURE CARDS (Rentals & Boutique) ───────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: My Rentals -> Rental Wardrobe & Bookings */}
          <button
            type="button"
            onClick={() => setActiveSection("bookings")}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 text-left h-32 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                My Rentals
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {bookings.length > 0 ? `${bookings.length} ${bookings.length === 1 ? 'Booking' : 'Bookings'}` : "Wardrobe & trials"}
              </p>
            </div>

            {/* 3D House / Wardrobe Illustration */}
            <div className="self-end pointer-events-none -mb-1 -mr-1">
              <svg className="h-14 w-16" viewBox="0 0 64 64" fill="none">
                {/* 3D House body */}
                <path
                  d="M16 28L32 16L48 28V52C48 53.1 47.1 54 46 54H18C16.9 54 16 53.1 16 52V28Z"
                  fill="url(#houseGrad)"
                />
                <path
                  d="M32 16L48 28H16L32 16Z"
                  fill="#4dd0e1"
                  filter="drop-shadow(0 2px 4px rgba(0,168,150,0.2))"
                />
                {/* Door */}
                <rect x="27" y="38" width="10" height="16" rx="2" fill="#00838f" />
                {/* Heart / Wedding Badge Bubble */}
                <circle cx="15" cy="22" r="9" fill="#ff4081" />
                <path
                  d="M15 24.5L12.5 22C11.5 21 11.5 19.5 12.5 18.5C13.5 17.5 15 17.5 15 18.5C15 17.5 16.5 17.5 17.5 18.5C18.5 19.5 18.5 21 17.5 22L15 24.5Z"
                  fill="white"
                />
                <defs>
                  <linearGradient id="houseGrad" x1="16" y1="16" x2="48" y2="54" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e0f7fa" />
                    <stop offset="1" stopColor="#b2ebf2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </button>

          {/* Card 2: Boutique Hub -> Boutique Owner Mode */}
          <Link
            href={profile.role === "owner" ? "/dashboard" : "/rent-your-outfit"}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 text-left h-32 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                Boutique Hub
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {profile.role === "owner" ? "Owner Dashboard" : "List & Earn ₹15k+"}
              </p>
            </div>

            {/* 3D Briefcase Illustration */}
            <div className="self-end pointer-events-none -mb-1 -mr-1">
              <svg className="h-14 w-16" viewBox="0 0 64 64" fill="none">
                {/* Handle */}
                <path
                  d="M26 22C26 19.8 27.8 18 30 18H34C36.2 18 38 19.8 38 22V24H26V22Z"
                  stroke="#37474f"
                  strokeWidth="3"
                />
                {/* Bag Body */}
                <rect x="12" y="24" width="40" height="28" rx="4" fill="url(#bagGrad)" />
                {/* Flap & Straps */}
                <path d="M12 24L32 36L52 24" stroke="#263238" strokeWidth="2" />
                <rect x="18" y="24" width="4" height="28" fill="#ffd54f" />
                <rect x="42" y="24" width="4" height="28" fill="#ffd54f" />
                <rect x="29" y="34" width="6" height="6" rx="1.5" fill="#ffa000" />
                <defs>
                  <linearGradient id="bagGrad" x1="12" y1="24" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#37474f" />
                    <stop offset="1" stopColor="#1e272c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Link>
        </div>

        {/* ── 4. QUICK ACTION (2x2 Grid) ───────────────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight">
            Quick action
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Payments & Deposit */}
            <button
              type="button"
              onClick={() => setActiveSection("payment")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              {/* 3D Styled Credit Card Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-500 shadow-xs">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" stroke="white" strokeWidth="2" />
                  <circle cx="6" cy="15" r="1.5" fill="#facc15" stroke="none" />
                  <circle cx="10" cy="15" r="1.5" fill="#fb923c" stroke="none" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                Payments &amp; Deposit
              </span>
            </button>

            {/* 2. Support center */}
            <button
              type="button"
              onClick={() => setActiveSection("support")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              {/* 3D Styled Headset Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 shadow-xs">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                Support center
              </span>
            </button>

            {/* 3. Login & Security */}
            <button
              type="button"
              onClick={() => setActiveSection("security")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              {/* 3D Styled Shield Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 shadow-xs">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                Login &amp; Security
              </span>
            </button>

            {/* 4. My vouchers */}
            <button
              type="button"
              onClick={() => setActiveSection("vouchers")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              {/* 3D Styled Ticket Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-400 shadow-xs">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="m10 13 2-2 2 2" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                My vouchers
              </span>
            </button>
          </div>
        </div>

        {/* ── 5. BENEFITS & OFFERS ─────────────────────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight">
            Benefits &amp; Offers
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Refer a friend */}
            <button
              type="button"
              onClick={() => setActiveSection("referral")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                Refer a friend
              </span>
            </button>

            {/* 2. VIP Bridal Pass */}
            <button
              type="button"
              onClick={() => setActiveSection("subscription")}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 text-left hover:shadow-md active:scale-98 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a896]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-gray-800 tracking-tight">
                VIP Bridal Pass
              </span>
            </button>
          </div>
        </div>

        {/* ── 6. SUPPORT & PARTNERSHIPS ────────────────────────────────────── */}
        <div className="space-y-2 pt-1 pb-4">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight mb-2">
            Support &amp; Partnerships
          </h2>

          <div className="rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/90 divide-y divide-gray-100 overflow-hidden">
            {/* Drive with Green SM -> Partner with ShaadiRent */}
            <Link
              href="/rent-your-outfit"
              className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-7 w-7 items-center justify-center text-gray-500">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  List Outfits &amp; Earn with ShaadiRent
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            {/* Terms & Policies */}
            <button
              type="button"
              onClick={() => setActiveSection("policies")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-7 w-7 items-center justify-center text-gray-500">
                  <HelpCircle size={18} />
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  Terms &amp; Policies
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            {/* Map contribution -> Fitting & Coverage */}
            <button
              type="button"
              onClick={() => setActiveSection("address")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-7 w-7 items-center justify-center text-gray-500">
                  <MapPin size={18} />
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  Doorstep Fitting &amp; Pickup Map
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            {/* Company information */}
            <button
              type="button"
              onClick={() => setActiveSection("company")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-7 w-7 items-center justify-center text-gray-500">
                  <Building size={18} />
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  Company information
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            {/* Sign Out Action */}
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className="w-full flex items-center justify-between p-4 hover:bg-rose-50/50 active:bg-rose-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3.5 text-rose-600">
                  <div className="flex h-7 w-7 items-center justify-center text-rose-500">
                    <LogOut size={18} />
                  </div>
                  <span className="text-xs font-semibold">
                    Sign Out
                  </span>
                </div>
                <ChevronRight size={16} className="text-rose-400" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
