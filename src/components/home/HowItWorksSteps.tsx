import { Calendar, Truck, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    icon: Calendar,
    title: "Pick Dates & Fit",
    desc: "Select your wedding weekend. Provide your measurements; we include an automatic backup size or custom margin.",
  },
  {
    step: "02",
    icon: Truck,
    title: "Delivered 2 Days Early",
    desc: "Arrives pristine, sanitized, and steam-pressed in a luxury garment bag 48 hours prior for complete peace of mind.",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Celebrate Royally",
    desc: "Walk down the aisle feeling like royalty. Every piece looks 100% brand-new with zero wear marks.",
  },
  {
    step: "04",
    icon: RefreshCw,
    title: "Hassle-Free Return",
    desc: "Place it back in the prepaid return bag. Our courier picks it up from your doorstep. Zero dry-cleaning needed.",
  },
];

export function HowItWorksSteps() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-800">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Seamless 4-Step Journey
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950">
            How ShaadiRent Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600">
            Engineered to eliminate wedding stress. No fitting surprises, no delayed parcels, no dry-cleaning hassles.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(({ step, icon: Icon, title, desc }) => (
            <div
              key={step}
              className="relative flex flex-col rounded-3xl border border-rose-100/70 bg-stone-50/60 p-7 transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1"
            >
              {/* Step Number */}
              <span className="font-display text-4xl font-bold text-rose-200/80">
                {step}
              </span>

              {/* Icon Box */}
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-800 shadow-xs">
                <Icon size={24} />
              </div>

              {/* Text */}
              <h3 className="mt-4 font-display text-lg font-bold text-stone-900">
                {title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed CTA Callout */}
        <div className="mt-12 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-800 hover:text-rose-950 underline underline-offset-4"
          >
            <span>Read our complete Hygiene, Alteration & Security Policy</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
