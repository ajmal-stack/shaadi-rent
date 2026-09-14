import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InspectionsClient } from "@/components/admin/InspectionsClient";

export const metadata: Metadata = {
  title: "Inspections — Admin Console",
  description: "Review garment quality, pre-rental and post-return inspection reports.",
};

export default async function AdminInspectionsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inspection_reports")
    .select(
      `
      id, inspection_type, condition_status, notes, deduction_amount, created_at,
      bookings!inspection_reports_booking_id_fkey ( id, booking_number ),
      profiles!inspection_reports_created_by_fkey ( id, full_name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load inspections:", error);

  const inspections = (data ?? []).map((item: any) => ({
    id: item.id as string,
    inspection_type: item.inspection_type,
    condition_status: item.condition_status,
    notes: item.notes as string | null,
    deduction_amount: Number(item.deduction_amount ?? 0),
    created_at: item.created_at as string,
    bookings: (item.bookings ?? item["bookings!inspection_reports_booking_id_fkey"] ?? null) as { id: string; booking_number: string } | null,
    inspector: (item.profiles ?? item["profiles!inspection_reports_created_by_fkey"] ?? null) as { id: string; full_name: string | null } | null,
  }));

  const damageCount = inspections.filter(
    (i) => i.condition_status === "minor_damage" || i.condition_status === "major_damage"
  ).length;

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Garment Inspections"
          subtitle="Pre-rental and post-return condition verification logs and security deposit deductions."
          icon={ClipboardCheck}
          breadcrumb={[{ label: "Inspections" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{inspections.length}</strong> total reports
              </span>
              <span>·</span>
              <span>
                <strong className={damageCount > 0 ? "text-amber-700" : "text-stone-600"}>
                  {damageCount} with damages
                </strong>
              </span>
            </div>
          }
        />

        <InspectionsClient initialInspections={inspections} />
      </div>
    </div>
  );
}
