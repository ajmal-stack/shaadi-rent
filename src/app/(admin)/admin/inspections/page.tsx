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

  // 1. Fetch all admin users (for inspector assignment)
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "admin")
    .order("full_name");

  const adminUsers = (adminProfiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name || p.email?.split("@")[0] || "Admin Staff",
    email: p.email || "",
  }));

  const adminMap = new Map(adminUsers.map((a) => [a.id, a]));

  // 2. Fetch recent bookings eligible for inspection
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(
      `
      id, booking_number, status, security_deposit,
      outfits!bookings_outfit_id_fkey ( id, title ),
      profiles!bookings_renter_id_fkey ( id, full_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(60);

  const eligibleBookings = (rawBookings ?? []).map((b: any) => {
    const outfit = b.outfits ?? b["outfits!bookings_outfit_id_fkey"];
    const renter = b.profiles ?? b["profiles!bookings_renter_id_fkey"];
    return {
      id: b.id as string,
      booking_number: b.booking_number as string,
      status: b.status as string,
      outfit_title: outfit?.title ?? "Designer Outfit",
      renter_name: renter?.full_name ?? "Customer",
      security_deposit: Number(b.security_deposit ?? 0),
    };
  });

  // 3. Fetch inspection reports with bookings and creator
  const { data, error } = await supabase
    .from("inspection_reports")
    .select(
      `
      id, inspection_type, condition_status, notes, deduction_amount, created_at, created_by, assigned_to,
      bookings!inspection_reports_booking_id_fkey (
        id, booking_number, status, total_amount, security_deposit,
        outfits!bookings_outfit_id_fkey ( id, title )
      ),
      profiles!inspection_reports_created_by_fkey ( id, full_name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load inspections:", error);

  const inspections = (data ?? []).map((item: any) => {
    const booking =
      item.bookings ?? item["bookings!inspection_reports_booking_id_fkey"];
    const outfit =
      booking?.outfits ?? booking?.["outfits!bookings_outfit_id_fkey"];
    const assignedUser = item.assigned_to ? adminMap.get(item.assigned_to) : null;

    return {
      id: item.id as string,
      inspection_type: item.inspection_type,
      condition_status: item.condition_status,
      notes: item.notes as string | null,
      deduction_amount: Number(item.deduction_amount ?? 0),
      created_at: item.created_at as string,
      created_by: item.created_by as string | null,
      assigned_to: item.assigned_to as string | null,
      assigned_inspector: assignedUser
        ? { id: assignedUser.id, full_name: assignedUser.full_name }
        : null,
      bookings: booking
        ? {
            id: booking.id,
            booking_number: booking.booking_number,
            status: booking.status,
            outfit_title: outfit?.title ?? "Designer Garment",
            security_deposit: Number(booking.security_deposit ?? 0),
          }
        : null,
      inspector: (item.profiles ??
        item["profiles!inspection_reports_created_by_fkey"] ??
        null) as { id: string; full_name: string | null } | null,
    };
  });

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
                <strong className="text-stone-800 dark:text-stone-200">{inspections.length}</strong> total reports
              </span>
              <span>·</span>
              <span>
                <strong className={damageCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-stone-600 dark:text-stone-400"}>
                  {damageCount} with damages
                </strong>
              </span>
            </div>
          }
        />

        <InspectionsClient
          initialInspections={inspections}
          adminUsers={adminUsers}
          eligibleBookings={eligibleBookings}
        />
      </div>
    </div>
  );
}
