import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("bookings")
      .select(
        `
        id, booking_number, rental_start_date, rental_end_date, total_amount,
        rental_amount, security_deposit, status, payment_status, created_at, updated_at,
        booking_notes,
        outfits!bookings_outfit_id_fkey ( id, title ),
        renter:profiles!bookings_renter_id_fkey ( id, full_name, email, phone ),
        owner:profiles!bookings_owner_id_fkey ( id, full_name, email, phone ),
        booking_events ( id, status, note, created_at ),
        inspection_reports ( id, inspection_type, condition_status, deduction_amount, notes, created_at )
      `
      )
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      console.error("Booking detail fetch error:", error);
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Booking detail API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
