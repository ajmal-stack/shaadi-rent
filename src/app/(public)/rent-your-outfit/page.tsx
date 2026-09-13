import Link from "next/link";
import { PlusCircle, DollarSign, Shield, Sparkles, CheckCircle2 } from "lucide-react";

export default function RentYourOutfitPage() {
  const benefits = [
    "Earn 15% - 25% of the outfit value per single rental",
    "Comprehensive damage protection & security deposits",
    "Professional dry-cleaning & insured logistics handled for you",
    "Retain full ownership — wear it whenever you want",
  ];

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Hero Banner */}
      <div className="border-b border-rose-100/70 bg-gradient-to-b from-amber-50/50 via-rose-50/40 to-white py-12 sm:py-16 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-900">
            <DollarSign size={13} className="text-amber-700" />
            Monetize Your Bridal Wardrobe
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            Rent Your Outfit & Earn
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-gray-600">
            Don&apos;t let your exquisite bridal lehenga or royal sherwani sit in the closet. Share the joy and earn every wedding season with complete peace of mind.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/login?next=/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 transition-all"
            >
              <PlusCircle size={16} />
              List Your Outfit Now
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Why list with ShaadiRent?
            </h2>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-900 to-stone-900 p-8 text-white shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-950 font-bold">
              <Shield size={24} />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-amber-100">
              Zero Risk Outfit Protection
            </h3>
            <p className="mt-2 text-sm text-rose-100/80 leading-relaxed">
              Every renter is Aadhaar/Govt ID verified. A mandatory security deposit covers minor accidental wear, and ShaadiRent&apos;s repair warranty covers up to ₹50,000 in damages.
            </p>
            <div className="mt-6 border-t border-white/15 pt-4 flex items-center justify-between text-xs text-amber-200/90">
              <span className="flex items-center gap-1">
                <Sparkles size={14} /> Certified dry-cleaning
              </span>
              <span>100% Insured Transit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
