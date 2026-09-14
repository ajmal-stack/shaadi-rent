import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Camera,
  Layers,
  FileCheck,
  RefreshCw,
  Home,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Application Status — ShaadiRent",
  description: "Track the real-time review status of your ShaadiRent owner application.",
};

export default async function OwnerApplicationStatusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/become-an-owner/status");
  }

  // Fetch application
  const { data: application } = await supabase
    .from("owner_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // If no application or just draft, redirect to apply
  if (!application || application.status === "draft") {
    redirect("/become-an-owner/apply");
  }

  const { status, submitted_at, admin_notes, id, id_type, full_name, phone, city, state } =
    application;

  const formattedDate = submitted_at
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(submitted_at))
    : "Recently";

  return (
    <div className="min-h-screen bg-stone-50/60 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-stone-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
          >
            <Home size={14} />
            <span>Home</span>
          </Link>
          <span>Application #{id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* ── STATE 1: PENDING (UNDER REVIEW) ────────────────────────── */}
        {status === "pending" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 animate-pulse">
                <Clock size={32} />
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Under Review
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                Your Application is Being Reviewed
              </h1>

              <p className="mt-3 text-sm sm:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
                Thank you for applying to become a ShaadiRent owner. Our compliance team is verifying your identity and contact details.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-100/80 px-4 py-2 text-xs font-mono text-stone-600">
                <span>Submitted on: {formattedDate}</span>
                <span>•</span>
                <span className="text-amber-800 font-semibold">Typical turnaround: 12–24h</span>
              </div>

              {/* Progress Timeline */}
              <div className="mt-10 border-t border-stone-100 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
                  {[
                    {
                      title: "Application Submitted",
                      desc: "Details received",
                      state: "done",
                    },
                    {
                      title: "Identity Check",
                      desc: "Verifying government ID",
                      state: "active",
                    },
                    {
                      title: "Admin Approval",
                      desc: "Role elevation",
                      state: "upcoming",
                    },
                    {
                      title: "Start Listing",
                      desc: "Outfit wizard unlocked",
                      state: "upcoming",
                    },
                  ].map((step, idx) => (
                    <div
                      key={step.title}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        step.state === "done"
                          ? "border-emerald-200 bg-emerald-50/50"
                          : step.state === "active"
                          ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-400/40"
                          : "border-stone-200 bg-stone-50/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.state === "done"
                              ? "bg-emerald-600 text-white"
                              : step.state === "active"
                              ? "bg-amber-600 text-white animate-spin"
                              : "bg-stone-300 text-stone-600"
                          }`}
                        >
                          {step.state === "done" ? (
                            <Check size={12} />
                          ) : step.state === "active" ? (
                            <RefreshCw size={10} />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="text-xs font-bold text-stone-900">{step.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submitted Summary Card */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-rose-800" />
                  <h3 className="text-sm font-bold text-stone-900">Submitted Information</h3>
                </div>
                <span className="text-xs text-stone-400">Read-only</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4">
                <div>
                  <span className="text-stone-400 block mb-0.5">Applicant</span>
                  <span className="font-semibold text-stone-800">{full_name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Contact</span>
                  <span className="font-semibold text-stone-800 font-mono">+91 {phone}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Government ID</span>
                  <span className="font-semibold text-stone-800 uppercase">{id_type}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Pickup Location</span>
                  <span className="font-semibold text-stone-800">{city}, {state}</span>
                </div>
              </div>
            </div>

            {/* Next Steps / Prep Tips */}
            <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-950 to-stone-900 text-white p-6 sm:p-8">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold tracking-wider uppercase mb-3">
                <Sparkles size={15} />
                <span>What you can prepare while waiting</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-rose-100/80">
                <div className="flex items-start gap-2.5">
                  <Camera size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">Take clear photos:</strong> Front, back, and detailed embroidery shots in bright natural lighting.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Layers size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">Measure your outfit:</strong> Record approximate bust, waist, hips, and length in inches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 2: APPROVED (VERIFIED OWNER) ─────────────────────── */}
        {status === "approved" && (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={40} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles size={13} className="text-emerald-600" />
              Verified Owner Account
            </div>

            <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
              Congratulations! Your Application is Approved
            </h1>

            <p className="text-sm sm:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
              Your identity has been verified by the ShaadiRent compliance team. You are now officially recognized as a trusted owner with full listing permissions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/list-your-outfit/details"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-950 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 hover:from-rose-900 hover:to-black transition-all hover:scale-102"
              >
                <span>List Your First Outfit</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-8 py-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-all"
              >
                <span>Go to Owner Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE 3: REJECTED (REVISION NEEDED) ────────────────────── */}
        {status === "rejected" && (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert size={40} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
              <AlertCircle size={14} className="text-rose-600" />
              Action Required / Revision Needed
            </div>

            <h1 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">
              Application Requires Revision
            </h1>

            <p className="text-sm text-stone-500 max-w-xl mx-auto leading-relaxed">
              Our review team encountered an issue with your submitted documents or information. Please check the feedback below and update your application.
            </p>

            {/* Admin Feedback Notes */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-left max-w-lg mx-auto space-y-2">
              <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Review Feedback from Compliance Team:
              </p>
              <p className="text-sm text-stone-800 font-medium leading-relaxed">
                {admin_notes || "Document photo was unclear or details did not match the provided ID number. Please re-upload clear photos."}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/become-an-owner/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 hover:from-rose-900 hover:to-stone-950 transition-all hover:scale-102"
              >
                <span>Update & Resubmit Application</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
