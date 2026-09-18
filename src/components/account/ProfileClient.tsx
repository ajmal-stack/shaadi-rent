"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/(customer)/account/actions";
import { signOut } from "@/app/(public)/auth/actions";

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
    "personal" | "bookings" | "address" | "boutique" | "security"
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

  return (
    <div className="min-h-screen bg-stone-50/60 pb-20 pt-4 sm:pt-6">
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

          {/* TAB 4: BOUTIQUE & EARNINGS HUB */}
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

          {/* TAB 5: SECURITY & SIGN OUT */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-950">
                  Security & Session
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your authenticated session and login security.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4.5 space-y-3 bg-gray-50/60">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">Signed in as</p>
                    <p className="text-gray-500">{profile.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Active Session
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Sign Out</h4>
                  <p className="text-[11px] text-gray-500">
                    Sign out of your ShaadiRent account on this device.
                  </p>
                </div>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
