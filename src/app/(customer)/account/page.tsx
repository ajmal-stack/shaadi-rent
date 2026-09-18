import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProfileClient,
  type ProfileData,
  type BookingSummary,
} from "@/components/account/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile & Account — ShaadiRent",
  description:
    "Manage your ShaadiRent personal details, rental bookings, and wardrobe preferences.",
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/auth/login?next=/account");
  }

  // Fetch full profile from Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, avatar_url, role, city, district, state, verification_status, created_at"
    )
    .eq("id", user.id)
    .single();

  const profileData: ProfileData = {
    id: user.id,
    full_name:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      "User",
    email: profile?.email ?? user.email ?? "",
    phone:
      profile?.phone ??
      (user.user_metadata?.phone as string | undefined) ??
      null,
    avatar_url:
      profile?.avatar_url ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      null,
    role: (profile?.role as "customer" | "owner" | "admin") ?? "customer",
    city: profile?.city ?? null,
    district: profile?.district ?? null,
    state: profile?.state ?? null,
    verification_status: profile?.verification_status ?? "pending",
    created_at:
      profile?.created_at ?? user.created_at ?? new Date().toISOString(),
  };

  // Fetch recent bookings for this renter
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(
      `
      id, booking_number, status, total_amount, rental_start_date, rental_end_date, created_at,
      outfits!bookings_outfit_id_fkey ( id, title )
    `
    )
    .eq("renter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const bookings: BookingSummary[] = (rawBookings ?? []).map((b: any) => ({
    id: b.id,
    booking_number: b.booking_number,
    status: b.status,
    total_amount: Number(b.total_amount ?? 0),
    rental_start_date: b.rental_start_date,
    rental_end_date: b.rental_end_date,
    created_at: b.created_at,
    outfit_title:
      (b.outfits ?? b["outfits!bookings_outfit_id_fkey"])?.title ??
      "Designer Bridal Outfit",
  }));

  // If user is owner, fetch total wardrobe outfits count
  let outfitCount = 0;
  if (profileData.role === "owner") {
    const { count } = await supabase
      .from("outfits")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);
    outfitCount = count ?? 0;
  }

  return (
    <ProfileClient
      initialProfile={profileData}
      bookings={bookings}
      outfitCount={outfitCount}
    />
  );
}
