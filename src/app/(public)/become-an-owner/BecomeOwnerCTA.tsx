import Link from "next/link";
import { ArrowRight, Clock, ShieldAlert } from "lucide-react";

interface BecomeOwnerCTAProps {
  applicationStatus?: "draft" | "pending" | "approved" | "rejected" | null;
  isLoggedIn?: boolean;
}

export function BecomeOwnerCTA({
  applicationStatus,
  isLoggedIn = false,
}: BecomeOwnerCTAProps) {
  // If not logged in, direct to login
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/auth/login?next=/become-an-owner/apply"
          className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-900/25 transition-all duration-200 hover:from-rose-800 hover:to-rose-950 hover:shadow-xl hover:shadow-rose-900/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <span>Sign In to Apply as Owner</span>
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
        <p className="text-xs text-stone-400 text-center">
          Takes ~5 minutes · Government ID required
        </p>
      </div>
    );
  }

  // If application is pending under review
  if (applicationStatus === "pending") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/become-an-owner/status"
          className="group inline-flex items-center gap-2.5 rounded-2xl bg-amber-500 px-8 py-4 text-base font-semibold text-stone-950 shadow-lg shadow-amber-900/20 hover:bg-amber-400 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <Clock size={18} className="animate-spin" />
          <span>Application Under Review — Check Status</span>
        </Link>
        <p className="text-xs text-amber-300 text-center">
          Submitted and being verified by our compliance team
        </p>
      </div>
    );
  }

  // If application was rejected / needs revision
  if (applicationStatus === "rejected") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/become-an-owner/status"
          className="group inline-flex items-center gap-2.5 rounded-2xl bg-rose-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-900/25 hover:bg-rose-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <ShieldAlert size={18} />
          <span>Revision Needed — View & Update Application</span>
        </Link>
        <p className="text-xs text-rose-300 text-center">
          Please review the compliance notes and resubmit
        </p>
      </div>
    );
  }

  // Fresh applicant or draft in progress
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href="/become-an-owner/apply"
        id="become-owner-cta"
        className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-900/25 transition-all duration-200 hover:from-rose-800 hover:to-rose-950 hover:shadow-xl hover:shadow-rose-900/30 hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <span>
          {applicationStatus === "draft"
            ? "Continue Owner Application"
            : "Start Owner Application"}
        </span>
        <ArrowRight
          size={18}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>

      <p className="text-xs text-stone-400 text-center">
        5 quick steps · Verified within 24 hours · Free to apply
      </p>
    </div>
  );
}
