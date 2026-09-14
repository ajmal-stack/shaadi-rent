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
      id, amount, currency, status, provider, provider_payment_id, created_at,
      bookings!payments_booking_id_fkey (
        id, booking_number, total_amount,
        profiles!bookings_renter_id_fkey ( full_name )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load payments:", error);

  const payments = (data ?? []).map((p: any) => {
    const booking = p.bookings ?? p["bookings!payments_booking_id_fkey"];
    const renter = booking ? (booking.profiles ?? booking["profiles!bookings_renter_id_fkey"]) : null;

    return {
      id: p.id as string,
      amount: p.amount as number,
      currency: p.currency as string,
      status: p.status,
      provider: p.provider as string,
      provider_payment_id: p.provider_payment_id as string | null,
      created_at: p.created_at as string,
      bookings: booking
        ? {
            id: booking.id,
            booking_number: booking.booking_number,
            total_amount: booking.total_amount,
            renter: renter ? { full_name: renter.full_name } : null,
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
