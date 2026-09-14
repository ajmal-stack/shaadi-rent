import Link from "next/link";
import { PlusCircle, DollarSign, Shield, CheckCircle2 } from "lucide-react";

export function LenderCallout() {
  return (
    <section className="py-16 sm:py-20 bg-stone-900 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-20 right-0 -z-0 h-96 w-96 rounded-full bg-rose-700/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
              <DollarSign size={13} />
              Lender Marketplace
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Don&apos;t Let Your Bridal Lehenga{" "}
              <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                Sit in a Suitcase.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
              Turn your past wedding outfit into <strong className="text-white">₹30,000 to ₹50,000 per wedding season</strong>. We handle verified renters, safe logistics, hospital-grade dry-cleaning, and full damage insurance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>100% Aadhaar Verified Renters</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Mandatory Security Deposits</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Zero Cleaning Effort (We handle it)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Wear it whenever you want</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/rent-your-outfit"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-amber-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-rose-800 hover:to-amber-800 transition-all active:scale-95"
              >
                <PlusCircle size={17} />
                <span>List Your Outfit & Earn</span>
              </Link>
            </div>
          </div>

          {/* Right card: Earnings Estimation Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Owner Shield Protection</h4>
                    <p className="text-[11px] text-stone-400">₹50,000 Damage Guarantee</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Protected
                </span>
              </div>

              {/* Sample Earning Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Bridal Lehenga (Avg 6 rentals/season)</span>
                  <span className="font-semibold text-white">₹30,000 – ₹45,000</span>
                </div>
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Groom Sherwani (Avg 5 rentals/season)</span>
                  <span className="font-semibold text-white">₹20,000 – ₹30,000</span>
                </div>
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Reception Gown (Avg 8 rentals/season)</span>
                  <span className="font-semibold text-white">₹24,000 – ₹35,000</span>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider font-bold text-amber-300">
                  Average Lender Season Earning
                </p>
                <p className="font-display text-2xl font-bold text-white mt-1">
                  ₹38,500 / year
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Paid directly to your bank account after each return.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
