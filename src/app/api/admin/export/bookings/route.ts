import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user & verify admin role
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    // 2. Parse optional date range query param
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range");

    const adminClient = createAdminClient();
    let query = adminClient
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        created_at,
        rental_start_date,
        rental_end_date,
        rental_amount,
        security_deposit,
        delivery_fee,
        service_fee,
        total_amount,
        status,
        payment_status,
        outfits!bookings_outfit_id_fkey ( title, brand ),
        renter:profiles!bookings_renter_id_fkey ( full_name, email, phone ),
        owner:profiles!bookings_owner_id_fkey ( full_name, email, phone )
      `
      )
      .order("created_at", { ascending: false });

    if (range && range !== "all") {
      const now = new Date();
      let days = 30;
      if (range === "7d") days = 7;
      else if (range === "90d") days = 90;
      now.setDate(now.getDate() - days);
      query = query.gte("created_at", now.toISOString());
    }

    const { data: bookings, error: bookingsErr } = await query;

    if (bookingsErr) {
      console.error("Error fetching bookings for export:", bookingsErr);
      return NextResponse.json(
        { error: "Failed to fetch bookings data", details: bookingsErr.message },
        { status: 500 }
      );
    }

    // 3. Construct CSV
    const headers = [
      "Booking ID",
      "Booking Number",
      "Created Date",
      "Renter Name",
      "Renter Email",
      "Renter Phone",
      "Owner Name",
      "Outfit Title",
      "Rental Start",
      "Rental End",
      "Rental Amount (INR)",
      "Security Deposit (INR)",
      "Delivery Fee (INR)",
      "Total Amount (INR)",
      "Booking Status",
      "Payment Status",
    ];

    const rows = ((bookings ?? []) as unknown as Array<Record<string, unknown>>).map((b) => {
      const outfit = (b.outfits as { title?: string; brand?: string } | null) || {};
      const renter = (b.renter as { full_name?: string; email?: string; phone?: string } | null) || {};
      const owner = (b.owner as { full_name?: string; email?: string; phone?: string } | null) || {};

      const createdDate = b.created_at ? new Date(b.created_at as string).toISOString().slice(0, 10) : "";

      return [
        escapeCsv(b.id),
        escapeCsv(b.booking_number),
        escapeCsv(createdDate),
        escapeCsv(renter.full_name || "N/A"),
        escapeCsv(renter.email || "N/A"),
        escapeCsv(renter.phone || "N/A"),
        escapeCsv(owner.full_name || "N/A"),
        escapeCsv(outfit.title || "N/A"),
        escapeCsv(b.rental_start_date),
        escapeCsv(b.rental_end_date),
        escapeCsv(b.rental_amount),
        escapeCsv(b.security_deposit),
        escapeCsv(b.delivery_fee),
        escapeCsv(b.total_amount),
        escapeCsv(b.status),
        escapeCsv(b.payment_status),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    const filename = range && range !== "all" 
      ? `bookings_${range}.csv` 
      : "bookings.csv";

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("CSV Export Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
