import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Outfit Submitted — ShaadiRent",
  description: "Your outfit has been submitted for verification on ShaadiRent.",
};

export default function SubmittedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-amber-50/20 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Success card */}
        <div className="rounded-3xl border border-rose-100 bg-white p-8 sm:p-10 shadow-xl text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              Outfit Submitted!
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed">
              Your outfit has been received and is now under review by the
              ShaadiRent team.
            </p>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900">
            <Clock size={16} className="text-amber-600" />
            Status: Under Review
          </div>

          {/* What happens next */}
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              What happens next
            </p>
            <ul className="space-y-3">
              {[
                {
                  icon: ShieldCheck,
                  text: "Our team will review your listing for completeness and accuracy",
                },
                {
                  icon: Mail,
                  text: "You'll be notified by email once approved (usually within 24–48 hours)",
                },
                {
                  icon: CheckCircle2,
                  text: "Once approved, your outfit goes live on ShaadiRent for customers to book",
                },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-stone-600">
                  <Icon
                    size={15}
                    className="text-rose-700 shrink-0 mt-0.5"
                  />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/list-your-outfit/details"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              List Another Outfit
            </Link>
            <Link
              href="/browse"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-rose-800 hover:to-rose-950 transition-all"
            >
              Browse Outfits
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-stone-400">
          Questions? Contact us at{" "}
          <a
            href="mailto:support@shaadirent.com"
            className="text-rose-700 hover:underline"
          >
            support@shaadirent.com
          </a>
        </p>
      </div>
    </div>
  );
}
