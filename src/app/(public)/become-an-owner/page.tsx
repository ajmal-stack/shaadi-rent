import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Star,
  Camera,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BecomeOwnerCTA } from "./BecomeOwnerCTA";

export const metadata: Metadata = {
  title: "Become an Owner — ShaadiRent",
  description:
    "Register as a ShaadiRent owner to list your wedding outfits for rent. Earn every season without losing ownership.",
};

const BENEFITS = [
  {
    icon: TrendingUp,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "Earn 15–25% Per Rental",
    desc: "Turn a ₹1,50,000 lehenga into ₹20,000–₹35,000 of passive income per wedding season.",
  },
  {
    icon: ShieldCheck,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "Zero-Risk Protection",
    desc: "Renters are ID-verified. A mandatory security deposit + up to ₹50,000 damage warranty keeps your outfit safe.",
  },
  {
    icon: Sparkles,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Professional Care Included",
    desc: "Certified dry-cleaning and steaming after every rental — your outfit returns better than it left.",
  },
  {
    icon: Clock,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "Retain Full Ownership",
    desc: "You decide when it's available. Block dates, pause anytime, wear it yourself whenever you want.",
  },
  {
    icon: Camera,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    title: "Free Professional Photos",
    desc: "Qualified sellers get a complimentary photography session to make their listing stand out.",
  },
  {
    icon: Star,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    title: "Verified Owner Badge",
    desc: "Earn trust with renters through our owner verification programme and priority search placement.",
  },
] as const;

const STEPS = [
  { step: "01", label: "Apply Online", desc: "5-step identity & contact details." },
  { step: "02", label: "Verification", desc: "Our team verifies ID within 24 h." },
  { step: "03", label: "Verified Badge", desc: "Gain full owner listing access." },
  { step: "04", label: "Start Earning", desc: "List outfits & receive rental orders." },
] as const;

const TESTIMONIALS = [
  {
    name: "Ananya S.",
    city: "Mumbai",
    quote:
      "My Sabyasachi lehenga has been rented 4 times this year. I've recovered 60% of what I paid for it — incredible!",
    earned: "₹48,000 earned",
  },
  {
    name: "Rahul M.",
    city: "Delhi",
    quote:
      "Listed my sherwani in under 15 minutes. The whole process — cleaning, delivery, deposit — is handled by ShaadiRent.",
    earned: "₹22,000 earned",
  },
  {
    name: "Priya K.",
    city: "Bangalore",
    quote:
      "Never thought someone else would wear my wedding outfit. Now it brings joy to other brides and money to me.",
    earned: "₹31,500 earned",
  },
] as const;

export default async function BecomeAnOwnerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login first.
  if (!user) {
    redirect("/auth/login?next=/become-an-owner");
  }

  // If already an owner or admin, skip straight to the wizard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "owner" || profile?.role === "admin") {
    redirect("/list-your-outfit/details");
  }

  // Fetch existing application
  const { data: application } = await supabase
    .from("owner_applications")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (application?.status === "pending") {
    redirect("/become-an-owner/status");
  }

  const appStatus = application?.status;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Back nav ────────────────────────────────────────────────── */}
      <div className="border-b border-stone-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5">
          <Link
            href="/rent-your-outfit"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 py-20 sm:py-28 text-center">
        {/* Decorative gradient orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-rose-700/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-300">
            <Sparkles size={13} />
            Owner Programme
          </div>

          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Your Outfit.
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
              Your Earnings.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-rose-100/80 leading-relaxed">
            Join thousands of owners who earn from their bridal lehengas,
            sherwanis, and wedding ensembles — without ever giving up ownership.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { val: "₹50K+", label: "Avg. first-year earnings" },
              { val: "24 h", label: "Listing verification" },
              { val: "100%", label: "Ownership retained" },
            ].map(({ val, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-amber-300">{val}</p>
                <p className="mt-0.5 text-[11px] text-rose-200/70 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="mt-10">
            <BecomeOwnerCTA applicationStatus={appStatus} isLoggedIn={true} />
          </div>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────── */}
      <div className="border-b border-stone-100 bg-stone-50/60 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-rose-950 sm:text-3xl">
            From closet to cash in 4 steps
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STEPS.map(({ step, label, desc }, i) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute top-7 left-[calc(50%+28px)] right-0 hidden sm:block h-px bg-gradient-to-r from-rose-200 to-transparent"
                  />
                )}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-white shadow-sm">
                  <span className="font-display text-lg font-bold text-rose-800">{step}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-stone-900">{label}</p>
                <p className="mt-1 text-xs text-stone-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Benefits grid ───────────────────────────────────────────── */}
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-rose-950 sm:text-3xl">
              Everything you need to succeed as an owner
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              We handle logistics. You collect earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-stone-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${border} ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">{title}</h3>
                <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <div className="border-t border-stone-100 bg-gradient-to-b from-amber-50/40 to-rose-50/20 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-rose-950 sm:text-3xl mb-10">
            Real owners. Real earnings.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, city, quote, earned }) => (
              <div
                key={name}
                className="rounded-2xl border border-rose-100/70 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{name}</p>
                    <p className="text-[11px] text-stone-400">{city}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    {earned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── What you need ───────────────────────────────────────────── */}
      <div className="border-t border-stone-100 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-2xl font-bold text-rose-950 sm:text-3xl">
            What you need to get started
          </h2>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {[
              "A wedding outfit in good or better condition",
              "Clear photos (phone camera is fine)",
              "Your outfit's approximate measurements",
              "A bank account to receive payouts",
              "A government-issued ID for verification",
              "At least one available date window per season",
            ].map((req) => (
              <li key={req} className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/70 px-4 py-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="text-sm text-stone-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <div className="border-t border-rose-100 bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 py-16 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to start earning?
          </h2>
          <p className="mt-3 text-rose-100/70 text-sm sm:text-base">
            Join the ShaadiRent owner community today. It takes less than 15 minutes to list your first outfit.
          </p>
          <div className="mt-8">
            <BecomeOwnerCTA applicationStatus={appStatus} isLoggedIn={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
