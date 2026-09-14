import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ApplicationReviewClient } from "@/components/admin/ApplicationReviewClient";
import type { OwnerApplication } from "@/types/database";

export const metadata: Metadata = {
  title: "Owner Applications Review — Admin Console",
  description: "Review, approve, or request revisions for ShaadiRent owner onboarding applications.",
};

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  // Fetch all submitted applications (non-draft)
  const { data: applications, error } = await supabase
    .from("owner_applications")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load applications:", error);
  }

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
              <Link href="/admin" className="hover:text-stone-900 transition-colors">
                Admin Console
              </Link>
              <ChevronRight size={13} />
              <span className="text-stone-900 font-medium">Owner Applications</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="text-rose-800" size={28} />
              <span>Owner Onboarding Applications</span>
            </h1>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl shadow-2xs"
          >
            ← Back to Overview
          </Link>
        </div>

        {/* Client Application Review Table & Actions */}
        <ApplicationReviewClient
          initialApplications={(applications as OwnerApplication[]) || []}
        />
      </div>
    </div>
  );
}
