import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DisputesClient } from "@/components/admin/DisputesClient";

export const metadata: Metadata = {
  title: "Disputes — Admin Console",
  description: "Arbitrate and resolve disputes between renters and boutique owners.",
};

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("disputes")
    .select(
      `
      id, reason, description, amount, status, resolution_notes, created_at, updated_at,
      bookings!disputes_booking_id_fkey ( id, booking_number ),
      profiles!disputes_raised_by_fkey ( id, full_name, email )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load disputes:", error);

  const disputes = (data ?? []).map((d: any) => ({
    id: d.id as string,
    reason: d.reason as string,
    description: d.description as string | null,
    amount: d.amount as number | null,
    status: d.status,
    resolution_notes: d.resolution_notes as string | null,
    created_at: d.created_at as string,
    updated_at: d.updated_at as string,
    bookings: (d.bookings ?? d["bookings!disputes_booking_id_fkey"] ?? null) as { id: string; booking_number: string } | null,
    profiles: (d.profiles ?? d["profiles!disputes_raised_by_fkey"] ?? null) as { id: string; full_name: string | null; email: string | null } | null,
  }));

  const openCount = disputes.filter(
    (d) => d.status === "open" || d.status === "under_review"
  ).length;

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Dispute Resolution"
          subtitle="Arbitrate security deposit claims, late returns, and garment condition disputes."
          icon={AlertTriangle}
          breadcrumb={[{ label: "Disputes" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{disputes.length}</strong> total disputes
              </span>
              <span>·</span>
              <span>
                <strong className={openCount > 0 ? "text-amber-700" : "text-stone-600"}>
                  {openCount} active
                </strong>
              </span>
            </div>
          }
        />

        <DisputesClient initialDisputes={disputes} />
      </div>
    </div>
  );
}
