import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentsClient } from "@/components/admin/PaymentsClient";

export const metadata: Metadata = {
  title: "Payments & Escrow — Admin Console",
  description: "Monitor and manage financial transactions, escrows, and payouts.",
};

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id, amount, currency, status, provider, provider_payment_id, provider_order_id, metadata, created_at, updated_at,
      bookings!payments_booking_id_fkey (
        id, booking_number, status, payment_status, rental_amount, security_deposit, total_amount,
        rental_start_date, rental_end_date, event_date, created_at,
        profiles!bookings_renter_id_fkey ( full_name, email, phone ),
        outfits!bookings_outfit_id_fkey ( id, title, brand, slug )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load payments:", error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = (data ?? []).map((p: any) => {
    const booking = p.bookings ?? p["bookings!payments_booking_id_fkey"];
    const renter = booking ? (booking.profiles ?? booking["profiles!bookings_renter_id_fkey"]) : null;
    const outfit = booking ? (booking.outfits ?? booking["outfits!bookings_outfit_id_fkey"]) : null;

    return {
      id: p.id as string,
      amount: p.amount as number,
      currency: p.currency as string,
      status: p.status,
      provider: p.provider as string,
      provider_payment_id: p.provider_payment_id as string | null,
      provider_order_id: p.provider_order_id as string | null,
      metadata: p.metadata,
      created_at: p.created_at as string,
      updated_at: p.updated_at as string,
      bookings: booking
        ? {
            id: booking.id,
            booking_number: booking.booking_number,
            status: booking.status,
            payment_status: booking.payment_status,
            rental_amount: booking.rental_amount,
            security_deposit: booking.security_deposit,
            total_amount: booking.total_amount,
            rental_start_date: booking.rental_start_date,
            rental_end_date: booking.rental_end_date,
            event_date: booking.event_date,
            created_at: booking.created_at,
            renter: renter
              ? {
                  full_name: renter.full_name,
                  email: renter.email,
                  phone: renter.phone,
                }
              : null,
            outfit: outfit
              ? {
                  title: outfit.title,
                  brand: outfit.brand,
                  slug: outfit.slug,
                }
              : null,
          }
        : null,
    };
  });

  const successfulCount = payments.filter(
    (p) => p.status === "successful"
  ).length;

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Payments & Escrow"
          subtitle="Real-time transaction log, payment statuses, and escrow balance tracking."
          icon={CreditCard}
          breadcrumb={[{ label: "Payments" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{payments.length}</strong> transactions
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700">{successfulCount}</strong> successful
              </span>
            </div>
          }
        />

        <PaymentsClient initialPayments={payments} />
      </div>
    </div>
  );
}
