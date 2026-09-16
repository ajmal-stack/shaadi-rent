"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Calendar,
  MapPin,
  Heart,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DatePicker } from "@/components/ui/DatePicker";

const CITIES = [
  { value: "All India", label: "All India" },
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Jaipur", label: "Jaipur" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "Lucknow", label: "Lucknow" },
];

const OCCASIONS = [
  { value: "all", label: "All Outfits" },
  { value: "bridal-lehenga", label: "Bridal Lehengas" },
  { value: "sherwani", label: "Groom Sherwanis" },
  { value: "gown", label: "Cocktail & Gowns" },
  { value: "anarkali", label: "Haldi & Mehendi" },
];

export function HeroSection() {
  const router = useRouter();
  const [occasion, setOccasion] = useState("all");
  const [city, setCity] = useState("All India");
  const [date, setDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (occasion !== "all") params.set("category", occasion);
    if (city !== "All India") params.set("city", city);
    if (date) params.set("date", date);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative z-20 bg-gradient-to-b from-rose-50/70 via-stone-50/40 to-white pt-8 sm:pt-14 pb-16 lg:pb-24">
      {/* Background radial accent glow isolated to prevent clipping dropdowns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ── Left Column: Headline & Value Proposition ── */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-rose-900 shadow-xs backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-600 animate-pulse" />
              <span>India&apos;s Premier Wedding Wear Rental Salon</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 leading-[1.12]">
              Wear Royal Couture on Your{" "}
              <span className="bg-gradient-to-r from-rose-800 via-rose-700 to-amber-700 bg-clip-text text-transparent">
                Special Day.
              </span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed mx-auto lg:mx-0">
              Rent authentic bridal lehengas, regal groom sherwanis & couture reception gowns at up to{" "}
              <strong className="text-stone-900 font-semibold">90% off retail</strong>. Hospital-grade dry cleaned, custom altered & delivered 48 hours early.
            </p>

            {/* ── Interactive Rental Finder Widget ── */}
            <div className="relative z-30 rounded-3xl border border-rose-100 bg-white/95 p-3 sm:p-4 shadow-xl shadow-rose-950/5 backdrop-blur-md">
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center"
              >
                {/* 1. Occasion Picker */}
                <CustomSelect
                  value={occasion}
                  onChange={setOccasion}
                  options={OCCASIONS}
                  label="Looking For"
                  icon={<Heart size={16} className="text-rose-700 shrink-0" />}
                />

                {/* 2. City Selector */}
                <CustomSelect
                  value={city}
                  onChange={setCity}
                  options={CITIES}
                  label="City Hub"
                  icon={<MapPin size={16} className="text-rose-700 shrink-0" />}
                />

                {/* 3. Event Date */}
                <DatePicker
                  value={date}
                  onChange={setDate}
                  label="Wedding Date"
                  placeholder="Select Date"
                  icon={<Calendar size={16} className="text-rose-700 shrink-0" />}
                  minDate={new Date()}
                  showPresets
                />

                {/* Submit Action (Spans full width) */}
                <div className="sm:col-span-3 pt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-900/20 hover:from-rose-800 hover:to-black transition-all active:scale-[0.99]"
                  >
                    <Search size={16} />
                    <span>Explore Available Outfits</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </div>

            {/* Floating Trust Signals */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-stone-500 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>100% Sanitized & Altered</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Free Backup Sizing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-600 shrink-0" />
                <span>Zero Cleaning Hassle</span>
              </span>
            </div>
          </div>

          {/* ── Right Column: High-Fashion Visual Editorial ── */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative ring */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-600/30 via-amber-400/20 to-rose-200/30 blur-lg opacity-70" />

              {/* Main Visual Image Card */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-white/80 bg-white shadow-2xl">
                <Image
                  src="/images/hero_wedding_couple.jpg"
                  alt="Royal Indian Bride and Groom wearing bespoke wedding couture"
                  width={680}
                  height={800}
                  priority
                  className="w-full h-[460px] sm:h-[520px] object-cover object-center transition-transform duration-700 hover:scale-105"
                />

                {/* Glassmorphic Floating Badge 1: Savings */}
                <div className="absolute top-4 left-4 rounded-2xl border border-white/40 bg-white/85 px-3.5 py-2 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      ₹
                    </span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-400">Retail ₹75,000</p>
                      <p className="text-xs font-extrabold text-stone-900">Rent for ₹4,999</p>
                    </div>
                  </div>
                </div>

                {/* Glassmorphic Floating Badge 2: Ratings */}
                <div className="absolute bottom-4 right-4 rounded-2xl border border-white/40 bg-stone-950/85 px-4 py-2.5 shadow-xl backdrop-blur-md text-white">
                  <p className="flex items-center gap-1 text-xs font-bold text-amber-300">
                    ★ 4.9 <span className="text-[10px] text-stone-300 font-normal">(2,400+ reviews)</span>
                  </p>
                  <p className="text-[11px] text-stone-200 mt-0.5">
                    &ldquo;Felt like royalty without the ₹1 Lakh guilt.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
