import { Star, Heart } from "lucide-react";

const REVIEWS = [
  {
    name: "Priya Sharma",
    role: "Bride • Delhi NCR",
    stars: 5,
    quote:
      "I wore a gorgeous velvet bridal lehenga worth ₹1.2 Lakh for just ₹5,200. Not a single guest guessed it was rented! The backup blouse margin was a lifesaver.",
    outfit: "Crimson Velvet Zardozi Lehenga",
  },
  {
    name: "Karan Malhotra",
    role: "Groom • Chandigarh",
    stars: 5,
    quote:
      "Arrived 48 hours early in a pristine luxury garment bag. Zero stress, perfect fit, and return was picked up right from my hotel after the reception.",
    outfit: "Royal Ivory Silk Sherwani Set",
  },
  {
    name: "Ananya Iyer",
    role: "Outfit Lender • Mumbai",
    stars: 5,
    quote:
      "My bridal lehenga had been sitting in my wardrobe for 2 years. Listed it with ShaadiRent and made ₹41,000 this wedding season! The dry-cleaning was immaculate.",
    outfit: "Heritage Raw Silk Bridal Lehenga",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-24 bg-rose-50/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-1 text-xs font-semibold text-rose-800 shadow-xs">
            <Heart size={13} className="text-rose-600 fill-rose-600" />
            Real Weddings, Real Joy
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950">
            Loved by 10,000+ Couples
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600">
            Discover why modern brides and grooms are ditching the guilt of one-time wardrobe purchases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review) => (
            <div
              key={review.name}
              className="flex flex-col justify-between rounded-3xl border border-rose-100/80 bg-white p-7 shadow-sm transition-all hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-stone-700 leading-relaxed italic">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              <div className="pt-6 border-t border-stone-100 mt-6">
                <p className="text-sm font-bold text-stone-900">{review.name}</p>
                <p className="text-xs text-stone-500">{review.role}</p>
                <span className="mt-2 inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                  {review.outfit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
