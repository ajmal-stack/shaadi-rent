import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BookingsClient } from "@/components/admin/BookingsClient";

export const metadata: Metadata = {
  title: "Bookings — Admin Console",
  description: "View and manage all rental bookings on ShaadiRent.",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id, booking_number, rental_start_date, rental_end_date, total_amount,
      rental_amount, security_deposit, status, payment_status, created_at,
      outfits!bookings_outfit_id_fkey ( id, title ),
      profiles!bookings_renter_id_fkey ( id, full_name, email )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load bookings:", error);

  // Remap join aliases
  const bookings = (data ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    booking_number: b.booking_number as string,
    rental_start_date: b.rental_start_date as string,
    rental_end_date: b.rental_end_date as string,
    total_amount: b.total_amount as number,
    rental_amount: b.rental_amount as number,
    security_deposit: b.security_deposit as number,
    status: b.status as string,
    payment_status: b.payment_status as string,
    created_at: b.created_at as string,
    outfits: ((b.outfits ?? b["outfits!bookings_outfit_id_fkey"]) as { id: string; title: string } | null) ?? null,
    renter: ((b.profiles ?? b["profiles!bookings_renter_id_fkey"]) as { id: string; full_name: string | null; email: string | null } | null) ?? null,
  }));

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "active").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    disputed: bookings.filter((b) => b.status === "disputed").length,
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Bookings"
          subtitle="Track all rental bookings across the platform — from pending to completed."
          icon={CalendarCheck}
          breadcrumb={[{ label: "Bookings" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{stats.total}</strong> total
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700">{stats.active}</strong> active
              </span>
              <span>·</span>
              <span>
                <strong className="text-stone-600">{stats.completed}</strong> completed
              </span>
              {stats.disputed > 0 && (
                <>
                  <span>·</span>
                  <span>
                    <strong className="text-rose-700">{stats.disputed}</strong> disputed
                  </span>
                </>
              )}
            </div>
          }
        />

        {/* @ts-expect-error - Runtime data shape matches component props */}
        <BookingsClient initialBookings={bookings} />
      </div>
    </div>
  );
}
