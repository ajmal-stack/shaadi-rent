import Link from "next/link";
import { Calendar, Sparkles, ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query existing bookings for this renter
  const { data: bookings } = user
    ? await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_number,
          status,
          payment_status,
          rental_start_date,
          rental_end_date,
          total_amount,
          security_deposit,
          created_at,
          outfits (
            id,
            title,
            brand
          )
        `
        )
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const hasBookings = bookings && bookings.length > 0;

  return (
    <div className="min-h-screen bg-stone-50/50 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rose-100/80 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
              <Calendar size={13} className="text-rose-700" />
              Customer Orders
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your upcoming outfit deliveries, active rentals, and return pickups.
            </p>
          </div>

          <Link
            href="/browse"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors"
          >
            <Sparkles size={15} />
            Rent Another Outfit
          </Link>
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {hasBookings ? (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-rose-100/80 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {booking.outfits?.title ?? `Booking #${booking.booking_number}`}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {booking.rental_start_date} → {booking.rental_end_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 uppercase tracking-wider">
                      {booking.status}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{booking.total_amount?.toLocaleString("en-IN") ?? "0"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-rose-200/80 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <Calendar size={28} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-gray-900">
                No Bookings Yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                You haven&apos;t reserved any wedding outfits yet. Browse our curated bridal and groom collections for your special occasion!
              </p>
              <div className="mt-6">
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors"
                >
                  <span>Explore Outfits</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
