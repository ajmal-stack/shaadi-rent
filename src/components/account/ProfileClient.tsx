"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LogOut,
  Save,
  Loader2,
  PlusCircle,
  Crown,
  Lock,
  Phone,
  Mail,
  Home,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  KeyRound,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProfileAction,
  changePasswordAction,
  updateNotificationPrefsAction,
  deleteAccountAction,
  type NotificationPreferences,
} from "@/app/(customer)/account/actions";
import { signOut } from "@/app/(public)/auth/actions";
import { MobileProfileView } from "./MobileProfileView";

export interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "customer" | "owner" | "admin";
  city: string | null;
  district: string | null;
  state: string | null;
  verification_status: "pending" | "verified" | "rejected";
  notification_prefs?: NotificationPreferences;
  auth_provider?: string;
  has_password?: boolean;
  created_at: string;
}

export interface BookingSummary {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  rental_start_date: string;
  rental_end_date: string;
  created_at: string;
  outfit_title?: string;
  outfit_image?: string | null;
}

interface ProfileClientProps {
  initialProfile: ProfileData;
  bookings: BookingSummary[];
  outfitCount?: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export function ProfileClient({
  initialProfile,
  bookings,
  outfitCount = 0,
}: ProfileClientProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [activeTab, setActiveTab] = useState<
    "personal" | "bookings" | "address" | "notifications" | "boutique" | "security"
  >("personal");

  // Form states
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [city, setCity] = useState(profile.city || "");
  const [district, setDistrict] = useState(profile.district || "");
  const [selectedState, setSelectedState] = useState(profile.state || "Delhi");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarInput, setAvatarInput] = useState(profile.avatar_url || "");

  // ── Password Change Form State (TASK 11.1) ──────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [hasPasswordAccount, setHasPasswordAccount] = useState<boolean>(
    initialProfile.has_password ?? true
  );
  const isGoogleAccount = initialProfile.auth_provider === "google";

  // ── Notification Preferences State (TASK 11.2) ──────────────────────────────
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    profile.notification_prefs || {
      email_bookings: true,
      sms_alerts: true,
      whatsapp_updates: true,
      promotions: false,
    }
  );
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // ── Delete Account Modal State (TASK 11.3) ──────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [isPending, startTransition] = useTransition();

  const initials = (profile.full_name || "User")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const activeBookingsCount = bookings.filter(
    (b) => b.status === "active" || b.status === "confirmed" || b.status === "delivered"
  ).length;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("phone", phone.trim());
      formData.append("city", city.trim());
      formData.append("district", district.trim());
      formData.append("state", selectedState.trim());
      if (avatarUrl) {
        formData.append("avatar_url", avatarUrl.trim());
      }

      const res = await updateProfileAction(formData);
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          full_name: res.data!.full_name,
          phone: res.data!.phone,
          city: res.data!.city,
          district: res.data!.district,
          state: res.data!.state,
          avatar_url: res.data!.avatar_url,
        }));
        toast.success("Profile updated successfully!");
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    });
  }

  function handleSaveAvatar() {
    if (avatarInput.trim()) {
      setAvatarUrl(avatarInput.trim());
      setIsEditingAvatar(false);
      toast.info("Avatar updated. Click 'Save Changes' to permanently save.");
    }
  }

  // ── Password Change / Set Handler (TASK 11.1) ────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (hasPasswordAccount && !currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePasswordAction(
        hasPasswordAccount ? currentPassword : undefined,
        newPassword
      );
      if (!res.success) {
        toast.error(res.error || "Failed to update password.");
      } else {
        if (!hasPasswordAccount) {
          setHasPasswordAccount(true);
          toast.success("Password created! You can now log in using either Google or your email & password.");
        } else {
          toast.success("Password updated successfully! Your account is secure.");
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("An unexpected error occurred while updating password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  // ── Notification Preferences Handlers (TASK 11.2) ─────────────────────────
  async function handleSaveNotificationPrefs(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const res = await updateNotificationPrefsAction(notificationPrefs);
      if (res.success) {
        toast.success("Notification preferences saved successfully!");
      } else {
        toast.error(res.error || "Failed to save preferences.");
      }
    } catch {
      toast.error("Failed to update notification preferences.");
    } finally {
      setIsSavingPrefs(false);
    }
  }

  function toggleNotificationPref(key: keyof NotificationPreferences) {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // ── Delete Account Handler (TASK 11.3) ────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirmText.trim() !== "DELETE") {
      toast.error("Please type DELETE to confirm account removal.");
      return;
    }

    if (activeBookingsCount > 0) {
      toast.error(
        `Cannot delete account: You have ${activeBookingsCount} active rental ${
          activeBookingsCount === 1 ? "booking" : "bookings"
        }. Please return all garments first.`
      );
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await deleteAccountAction();
      if (!res.success) {
        toast.error(res.error || "Failed to delete account.");
        setIsDeletingAccount(false);
      } else {
        toast.success("Account deleted successfully. We're sorry to see you go.");
        window.location.href = "/";
      }
    } catch {
      toast.error("Failed to delete account. Please try again or contact support.");
      setIsDeletingAccount(false);
    }
  }

  return (
    <>
      {/* ── MOBILE VIEW (< md) ── Screenshot-inspired Superapp Hub Layout ── */}
      <div className="block md:hidden">
        <MobileProfileView
          profile={profile}
          setProfile={setProfile}
          bookings={bookings}
          outfitCount={outfitCount}
          initials={initials}
          memberSince={memberSince}
          activeBookingsCount={activeBookingsCount}
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          city={city}
          setCity={setCity}
          district={district}
          setDistrict={setDistrict}
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          isEditingAvatar={isEditingAvatar}
          setIsEditingAvatar={setIsEditingAvatar}
          avatarInput={avatarInput}
          setAvatarInput={setAvatarInput}
          handleSaveAvatar={handleSaveAvatar}
          handleSaveProfile={handleSaveProfile}
          isPending={isPending}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          isChangingPassword={isChangingPassword}
          hasPasswordAccount={hasPasswordAccount}
          isGoogleAccount={isGoogleAccount}
          handleChangePassword={handleChangePassword}
          notificationPrefs={notificationPrefs}
          toggleNotificationPref={toggleNotificationPref}
          handleSaveNotificationPrefs={handleSaveNotificationPrefs}
          isSavingPrefs={isSavingPrefs}
          setDeleteModalOpen={setDeleteModalOpen}
        />
      </div>

      {/* ── DESKTOP & TABLET VIEW (≥ md) ── Existing Luxury Tabbed Layout ── */}
      <div className="hidden md:block min-h-screen bg-stone-50/60 pb-20 pt-4 sm:pt-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ── LUXURY HERO BANNER ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white shadow-xl ring-1 ring-rose-900/30">
          {/* Subtle Ambient Mandala / Pattern glow */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-radial from-amber-400/20 via-rose-500/10 to-transparent blur-2xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute left-10 -bottom-10 h-60 w-60 rounded-full bg-radial from-rose-500/20 to-transparent blur-3xl pointer-events-none"
          />

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Ring & Edit Camera Trigger */}
            <div className="relative shrink-0 group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.full_name || "Profile"}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-white/90 shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-rose-700 text-3xl font-bold text-white shadow-2xl ring-4 ring-white/90">
                  {initials}
                </div>
              )}

              {/* Edit Avatar Trigger */}
              <button
                type="button"
                onClick={() => setIsEditingAvatar((prev) => !prev)}
                title="Change profile avatar"
                aria-label="Change profile avatar"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-700 text-white shadow-lg ring-2 ring-white hover:bg-rose-800 transition-transform active:scale-90"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Profile Info & Badges */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {profile.full_name || "User Profile"}
                </h1>

                {/* Role Pill */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {profile.role === "owner" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-0.5 text-xs font-bold text-amber-200 backdrop-blur-xs">
                      <Crown size={12} className="text-amber-300" />
                      Boutique Owner
                    </span>
                  )}
                  {profile.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/20 border border-purple-300/40 px-3 py-0.5 text-xs font-bold text-purple-200 backdrop-blur-xs">
                      <ShieldCheck size={12} className="text-purple-300" />
                      Admin
                    </span>
                  )}
                  {profile.role === "customer" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-3 py-0.5 text-xs font-medium text-rose-100 backdrop-blur-xs">
                      Customer
                    </span>
                  )}

                  {/* Verification Status Pill */}
                  {profile.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-300" />
                      Verified
                    </span>
                  )}
                  {profile.verification_status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-bold text-amber-200">
                      <Clock size={12} className="text-amber-300" />
                      Pending KYC
                    </span>
                  )}
                </div>
              </div>

              {/* Subtitle Details */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-rose-100/80">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-amber-300/80" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Phone size={13} className="text-amber-300/80" />
                    +91 {profile.phone}
                  </span>
                )}
                {profile.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-300/80" />
                    {profile.city}
                    {profile.state ? `, ${profile.state}` : ""}
                  </span>
                )}
              </div>

              {/* Member Since Tag */}
              <p className="text-[11px] text-rose-200/60 pt-0.5">
                ShaadiRent Member since {memberSince}
              </p>
            </div>

            {/* Top Right Quick CTA for Owners / Upgrades */}
            {profile.role === "customer" ? (
              <Link
                href="/rent-your-outfit"
                className="hidden lg:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-amber-950 shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 shrink-0"
              >
                <Sparkles size={14} />
                <span>Earn With Your Outfits</span>
              </Link>
            ) : profile.role === "owner" ? (
              <Link
                href="/dashboard"
                className="hidden lg:inline-flex items-center gap-2 rounded-2xl bg-amber-400/20 border border-amber-300/40 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-400/30 transition-all active:scale-95 shrink-0"
              >
                <Crown size={14} />
                <span>Owner Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/admin"
                className="hidden lg:inline-flex items-center gap-2 rounded-2xl bg-white/20 border border-white/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 transition-all active:scale-95 shrink-0"
              >
                <ShieldCheck size={14} />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Quick Photo URL Editor Drawer / Popover */}
          {isEditingAvatar && (
            <div className="border-t border-white/10 bg-black/30 p-4 sm:px-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 backdrop-blur-md">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-rose-100 mb-1">
                  Profile Photo URL (JPG, PNG, WebP)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or Cloudinary URL"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs text-white placeholder-rose-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto sm:mt-5">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-amber-950 transition-colors"
                >
                  Set Photo
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(false)}
                  className="rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── QUICK STATS HIGHLIGHTS ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-rose-100/90 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Total Bookings</p>
            <p className="mt-1 font-display text-2xl font-bold text-rose-950">
              {bookings.length}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100/90 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Active Rentals</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-700">
              {activeBookingsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100/90 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Account Type</p>
            <p className="mt-1 font-display text-lg font-bold text-amber-900 capitalize">
              {profile.role}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100/90 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">Wardrobe Items</p>
            <p className="mt-1 font-display text-2xl font-bold text-gray-900">
              {profile.role === "owner" ? outfitCount : 0}
            </p>
          </div>
        </div>

        {/* ── TAB NAVIGATION ──────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-rose-100/80 bg-white p-1.5 shadow-xs scrollbar-none">
          {([
            { id: "personal", label: "Personal Details", icon: User },
            { id: "bookings", label: `My Bookings (${bookings.length})`, icon: Calendar },
            { id: "address", label: "Address & Pickup", icon: MapPin },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "boutique", label: "Boutique & Earnings", icon: Sparkles },
            { id: "security", label: "Security & Login", icon: Lock },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-rose-900 text-white shadow-xs"
                    : "text-gray-600 hover:bg-rose-50/80 hover:text-rose-900"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-rose-100/90 bg-white p-6 sm:p-8 shadow-xs">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === "personal" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-950">
                  Personal Information
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Keep your personal contact details updated to receive booking alerts and delivery updates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    Mobile Number (WhatsApp)
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 px-3 text-xs font-semibold text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full rounded-r-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-mono text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Used for OTP verification and booking delivery calls.
                  </p>
                </div>

                {/* Email (Read only) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={profile.email || ""}
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed pr-10"
                    />
                    <Lock
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ✓ Verified via Google / Auth Login
                  </p>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
                  />
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. South Delhi"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition-all"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>{isPending ? "Saving Changes…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MY BOOKINGS & ACTIVITY */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-950">
                    My Rental Bookings
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Track your wedding outfits, upcoming dates, and delivery status.
                  </p>
                </div>
                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 hover:text-rose-950"
                >
                  <span>View All Bookings</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <Calendar size={22} />
                  </div>
                  <h3 className="font-display text-base font-bold text-rose-950">
                    No Rental Bookings Yet
                  </h3>
                  <p className="mx-auto max-w-sm text-xs text-gray-500 leading-relaxed">
                    You haven’t booked any wedding couture yet. Explore our curated collections of designer bridal lehengas, sherwanis, and luxury accessories.
                  </p>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
                  >
                    <Sparkles size={14} />
                    <span>Browse Outfits</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-gray-200/90 bg-white p-4.5 hover:border-rose-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
                            #{booking.booking_number}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {booking.outfit_title || "Designer Bridal Outfit"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Rental Dates:{" "}
                          <span className="font-medium text-gray-700">
                            {new Date(booking.rental_start_date).toLocaleDateString("en-IN")}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-gray-700">
                            {new Date(booking.rental_end_date).toLocaleDateString("en-IN")}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-gray-900">
                            ₹{booking.total_amount.toLocaleString("en-IN")}
                          </p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                            {booking.status}
                          </span>
                        </div>
                        <Link
                          href={`/bookings`}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESS & DELIVERY */}
          {activeTab === "address" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-950">
                  Saved Address
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your primary location for outfit trial fitments and return pickups.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-stone-50/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <Home size={15} />
                    <span>Primary Fitting & Delivery Address</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Default
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-700">
                  <p className="font-bold text-sm text-gray-900">
                    {profile.full_name || "Name not set"}
                  </p>
                  <p>
                    {profile.city || "City not set"}
                    {profile.district ? `, ${profile.district}` : ""}
                  </p>
                  <p>{profile.state || "State not set"}, India</p>
                  <p className="text-gray-500 pt-1">
                    Contact Phone: {profile.phone ? `+91 ${profile.phone}` : "Not provided"}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("personal")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950"
                  >
                    <span>Edit this address in Personal Details</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATION PREFERENCES (TASK 11.2) */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-950">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose which booking milestones and styling alerts you wish to receive.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSavingPrefs}
                  onClick={() => handleSaveNotificationPrefs()}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-900 hover:bg-rose-950 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  {isSavingPrefs ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>{isSavingPrefs ? "Saving..." : "Save Preferences"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Email Booking Updates */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 flex items-start justify-between gap-4 transition-colors hover:bg-white hover:border-rose-200 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Email Booking Updates
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Receive confirmation receipts, doorstep trial schedules, and return pickup reminders via email.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("email_bookings")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notificationPrefs.email_bookings ? "bg-rose-900" : "bg-stone-300"
                    }`}
                    role="switch"
                    aria-checked={notificationPrefs.email_bookings}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.email_bookings ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 2. SMS Delivery Alerts */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 flex items-start justify-between gap-4 transition-colors hover:bg-white hover:border-rose-200 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        SMS Delivery Alerts
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Real-time SMS alerts with courier delivery tracking links and outfit return pickup OTPs.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("sms_alerts")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notificationPrefs.sms_alerts ? "bg-rose-900" : "bg-stone-300"
                    }`}
                    role="switch"
                    aria-checked={notificationPrefs.sms_alerts}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.sms_alerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. WhatsApp Notifications */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 flex items-start justify-between gap-4 transition-colors hover:bg-white hover:border-rose-200 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        WhatsApp Notifications
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Get invoice PDFs, fitting notes, and quick concierge assistance directly on WhatsApp.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("whatsapp_updates")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notificationPrefs.whatsapp_updates ? "bg-rose-900" : "bg-stone-300"
                    }`}
                    role="switch"
                    aria-checked={notificationPrefs.whatsapp_updates}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.whatsapp_updates ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Promotional & Style Drops */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 flex items-start justify-between gap-4 transition-colors hover:bg-white hover:border-rose-200 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-800">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Festive Deals &amp; New Arrivals
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Early bird access to Sabyasachi, Manish Malhotra drop alerts, and festive promo codes.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotificationPref("promotions")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notificationPrefs.promotions ? "bg-rose-900" : "bg-stone-300"
                    }`}
                    role="switch"
                    aria-checked={notificationPrefs.promotions}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.promotions ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BOUTIQUE & EARNINGS HUB */}
          {activeTab === "boutique" && (
            <div className="space-y-6">
              {profile.role === "customer" ? (
                <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent p-6 sm:p-8 border border-amber-200/80 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-0.5 text-xs font-bold text-amber-900">
                      <Crown size={13} className="text-amber-700" />
                      <span>Earn As A Boutique Owner</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      Turn Your Wedding Closet Into Monthly Income
                    </h2>
                    <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                      Don’t let your luxury bridal lehengas and wedding sherwanis sit idle in suitcases. List them on ShaadiRent with 100% security deposit protection and verified doorstep courier pickups.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs">
                      <p className="font-bold text-gray-900">🛡️ Full Deposit Escrow</p>
                      <p className="text-gray-500 mt-1 text-[11px]">
                        100% security deposit held in escrow before dress is handed over.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs">
                      <p className="font-bold text-gray-900">📦 Doorstep Pickup</p>
                      <p className="text-gray-500 mt-1 text-[11px]">
                        Our logistics partners handle delivery, inspection, and return dry-cleaning.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs">
                      <p className="font-bold text-gray-900">💰 Earn ₹15,000–50,000</p>
                      <p className="text-gray-500 mt-1 text-[11px]">
                        Average owner recovers 80% of garment cost within 3 rentals.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/rent-your-outfit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-700 hover:to-rose-800 px-6 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Apply to Become a Verified Owner</span>
                  </Link>
                </div>
              ) : profile.role === "owner" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-gray-950">
                      Boutique Owner Dashboard
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage your listed wedding garments, calendar availability, and renter payouts.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Active Boutique Account
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        You have {outfitCount} active garments listed in your wedding wardrobe.
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-colors shrink-0"
                    >
                      <Crown size={14} />
                      <span>Open Owner Dashboard</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-purple-950">
                      Platform Administrator
                    </h4>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Access user KYC, dispute arbitration, payment logs, and platform settings.
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    <ShieldCheck size={14} />
                    <span>Open Admin Console</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SECURITY, PASSWORD & ACCOUNT LIFECYCLE */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-950">
                  Security &amp; Login
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your authenticated session, password, and account security.
                </p>
              </div>

              {/* 1. Active Session Card */}
              <div className="rounded-2xl border border-gray-200 p-4.5 space-y-3 bg-gray-50/60 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-gray-900">Signed in as</p>
                    <p className="text-gray-500 mt-0.5">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGoogleAccount && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-700 bg-white border border-stone-200 shadow-2xs px-2.5 py-1 rounded-full">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Google Account
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={12} /> Active Session
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. TASK 11.1: Change / Set Password Card */}
              <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-900">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-gray-950">
                      {hasPasswordAccount ? "Change Password" : "Set Account Password"}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {hasPasswordAccount
                        ? "Ensure your account uses a secure password of at least 8 characters."
                        : "You signed in with Google. Set a password below to also log in with email directly."}
                    </p>
                  </div>
                </div>

                {!hasPasswordAccount && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
                    <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Google Login Active:</strong> You currently log in with one click via Google. Setting a password below allows you to sign in with <strong>both Google and Email/Password</strong> on any device without losing your Google login.
                    </p>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  {/* Current Password — Only shown if account already has an existing password */}
                  {hasPasswordAccount && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your existing password"
                          required
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 pr-10 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                          aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                        >
                          {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-stone-700">
                          {hasPasswordAccount ? "New Password" : "Create Password"}
                        </label>
                        <span className="text-[10px] text-stone-400">Min 8 chars</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          minLength={8}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 pr-10 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                          aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        >
                          {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-stone-700">
                          Confirm Password
                        </label>
                        {confirmPassword && (
                          <span
                            className={`text-[10px] font-semibold ${
                              newPassword === confirmPassword
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {newPassword === confirmPassword
                              ? "Passwords match ✓"
                              : "Passwords do not match"}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          minLength={8}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 pr-10 text-xs text-stone-900 placeholder:text-stone-400 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={
                        isChangingPassword ||
                        !newPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword ||
                        (hasPasswordAccount && !currentPassword)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-900 hover:bg-rose-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPassword ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Lock size={14} />
                      )}
                      <span>
                        {isChangingPassword
                          ? hasPasswordAccount
                            ? "Updating Password..."
                            : "Setting Password..."
                          : hasPasswordAccount
                          ? "Update Password"
                          : "Set Account Password"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Sign Out */}
              <div className="rounded-2xl border border-gray-200 p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Sign Out of Account</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    End your active authenticated session on this browser device.
                  </p>
                </div>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>

              {/* 4. TASK 11.3: Danger Zone / Delete Account */}
              <div className="rounded-3xl border border-rose-200/90 bg-rose-50/40 p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-rose-700" />
                      <h3 className="font-display text-base font-bold text-rose-950">
                        Danger Zone
                      </h3>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                      Permanently delete your account, booking history, measurements, and boutique listings. Once deleted, this account cannot be recovered.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText("");
                      setDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-100/80 px-4 py-2.5 text-xs font-bold text-rose-800 transition-colors shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Trash2 size={14} className="text-rose-700" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ── Delete Account Security Confirmation Modal (TASK 11.3) ──────────── */}
      {deleteModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => !isDeletingAccount && setDeleteModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-rose-100 z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-stone-950 leading-tight">
                    Delete ShaadiRent Account?
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              {activeBookingsCount > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2 mb-6">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-amber-700" />
                    Active Outfit Rentals Detected
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    You currently have <strong>{activeBookingsCount} active rental {activeBookingsCount === 1 ? "booking" : "bookings"}</strong>. You must complete or return your designer garments before your account can be closed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 text-xs text-stone-600">
                  <p>By deleting your account:</p>
                  <ul className="space-y-1.5 list-disc pl-5 text-stone-500 text-[11px]">
                    <li>All personal profile and measurement data will be erased.</li>
                    <li>Your order history and invoices will be deleted.</li>
                    <li>Saved wishlist items and boutique listings will be removed.</li>
                  </ul>

                  <div className="pt-2">
                    <label className="block font-semibold text-stone-800 mb-1.5">
                      To confirm, type <span className="font-mono font-bold text-rose-900">DELETE</span> below:
                    </label>
                    <input
                      type="text"
                      placeholder="Type DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      disabled={isDeletingAccount}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 justify-end pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    isDeletingAccount ||
                    activeBookingsCount > 0 ||
                    deleteConfirmText.trim() !== "DELETE"
                  }
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isDeletingAccount ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  <span>{isDeletingAccount ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
