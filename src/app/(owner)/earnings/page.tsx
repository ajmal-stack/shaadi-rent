import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOutfitImageUrl } from "@/lib/utils/image";
import {
  EarningsClient,
  type EarningTransaction,
  type EarningsSummary,
} from "@/components/owner/EarningsClient";
import { Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Owner Earnings & Payouts — ShaadiRent",
  description: "Track your rental income, platform commissions, and escrow payouts.",
};

export default async function OwnerEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    notFound();
  }

  // 1. Fetch dynamic platform commission & escrow settings
  const admin = createAdminClient();
  const { data: settingsData } = await admin
    .from("platform_settings")
    .select("key, value")
    .in("key", ["commission_percent", "escrow_release_buffer_days"]);

  let commissionPercent = 15;
  let escrowBufferDays = 2;

  if (settingsData) {
    for (const item of settingsData) {
      if (item.key === "commission_percent" && typeof item.value === "number") {
        commissionPercent = item.value;
      }
      if (
        item.key === "escrow_release_buffer_days" &&
        typeof item.value === "number"
      ) {
        escrowBufferDays = item.value;
      }
    }
  }

  // 2. Fetch owner's bookings
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      rental_start_date,
      rental_end_date,
      event_date,
      rental_amount,
      security_deposit,
      delivery_fee,
      service_fee,
      total_amount,
      status,
      payment_status,
      created_at,
      updated_at,
      outfits!bookings_outfit_id_fkey (
        id,
        title,
        brand,
        slug,
        images:outfit_images(storage_path, sort_order)
      ),
      renter:profiles!bookings_renter_id_fkey (
        full_name,
        email
      )
    `
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = rawBookings || [];

  // Helper to get primary image
  function getPrimaryImage(images: Array<{ storage_path: string; sort_order: number }> | null) {
    if (!images || images.length === 0) return getOutfitImageUrl(null);
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    return getOutfitImageUrl(sorted[0].storage_path);
  }

  // Current month reference for monthly earnings calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let totalRealized = 0;
  let thisMonthRealized = 0;
  let pendingEscrow = 0;
  let disputedAmount = 0;
  let completedCount = 0;

  const transactions: EarningTransaction[] = bookings.map((b) => {
    const grossRental = Number(b.rental_amount) || 0;
    const commissionAmount = Math.round((grossRental * commissionPercent) / 100);
    const netEarning = Math.max(0, grossRental - commissionAmount);

    // Determine payout status
    let payoutStatus: EarningTransaction["payoutStatus"];
    if (b.status === "completed") {
      payoutStatus = "released";
      totalRealized += netEarning;
      completedCount += 1;

      // Check if completed in current calendar month
      const completionDate = new Date(b.updated_at || b.created_at);
      if (
        completionDate.getFullYear() === currentYear &&
        completionDate.getMonth() === currentMonth
      ) {
        thisMonthRealized += netEarning;
      }
    } else if (b.status === "disputed") {
      payoutStatus = "on_hold";
      disputedAmount += netEarning;
    } else if (b.status === "cancelled") {
      payoutStatus = "cancelled";
    } else if (b.payment_status === "paid") {
      payoutStatus = "in_escrow";
      pendingEscrow += netEarning;
    } else {
      payoutStatus = "unpaid";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outfitRaw = b.outfits as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renterRaw = b.renter as any;

    return {
      id: b.id,
      bookingNumber: b.booking_number,
      rentalStartDate: b.rental_start_date,
      rentalEndDate: b.rental_end_date,
      eventDate: b.event_date,
      rentalAmount: grossRental,
      commissionRate: commissionPercent,
      commissionAmount,
      netEarning,
      bookingStatus: b.status,
      paymentStatus: b.payment_status,
      payoutStatus,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      outfit: outfitRaw
        ? {
            id: outfitRaw.id,
            title: outfitRaw.title,
            brand: outfitRaw.brand,
            slug: outfitRaw.slug,
            imageUrl: getPrimaryImage(outfitRaw.images),
          }
        : null,
      renter: renterRaw
        ? {
            fullName: renterRaw.full_name,
            email: renterRaw.email,
          }
        : null,
    };
  });

  const summary: EarningsSummary = {
    totalRealized,
    thisMonthRealized,
    pendingEscrow,
    disputedAmount,
    completedCount,
    totalBookings: bookings.length,
    commissionPercent,
    escrowBufferDays,
  };

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-700 to-stone-900 text-white shadow-sm">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">
                Earnings &amp; Payouts
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Financial overview, platform commission deductions, and payout history
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Escrow Payout Buffer: {escrowBufferDays} Days</span>
          </div>
        </div>

        {/* ── Client Component with Summary Cards, Search, Filters & Transactions ── */}
        <EarningsClient transactions={transactions} summary={summary} />
      </div>
    </div>
  );
}
