import Link from "next/link";
import { Search, Sparkles, Truck, RefreshCw, ShieldCheck } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      icon: Search,
      title: "Discover Your Dream Fit",
      description:
        "Browse our verified catalog of authentic bridal lehengas, sherwanis, and luxury reception gowns with custom fit details.",
    },
    {
      step: "02",
      icon: Truck,
      title: "Doorstep Delivery & Try-on",
      description:
        "Your outfit arrives pristine, dry-cleaned, and steamed 2 days prior to your wedding event with complete alteration kits.",
    },
    {
      step: "03",
      icon: RefreshCw,
      title: "Celebrate & Return",
      description:
        "Wear it with confidence! On the next day, pack it into the prepaid courier bag. We handle all dry-cleaning and pickup.",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Header */}
      <div className="border-b border-rose-100/70 bg-gradient-to-b from-rose-50/60 via-white to-transparent py-12 sm:py-16 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-800">
            <Sparkles size={13} className="text-amber-600" />
            Simple 3-Step Process
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-rose-950 sm:text-5xl">
            How ShaadiRent Works
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-gray-600">
            Luxury wedding fashion made effortless. Rent high-end designer bridal & groom wear without the hefty price tag.
          </p>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ step, icon: Icon, title, description }) => (
            <div
              key={step}
              className="relative flex flex-col rounded-3xl border border-rose-100/80 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <span className="font-display text-4xl font-bold text-rose-200">
                {step}
              </span>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100/70 text-rose-700">
                <Icon size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Assurance Box */}
        <div className="mt-14 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-rose-50/60 to-white p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="font-display text-xl font-bold text-rose-950">
                100% Quality & Hygiene Guarantee
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                Every outfit passes an 8-point physical inspection and hospital-grade sanitization before dispatch. Zero stress, only royal celebrations.
              </p>
            </div>
            <div className="sm:ml-auto shrink-0">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center rounded-xl bg-rose-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 transition-colors"
              >
                Browse Outfits
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
