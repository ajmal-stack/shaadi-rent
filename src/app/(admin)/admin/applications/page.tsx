import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
        <AdminPageHeader
          title="Owner Onboarding Applications"
          subtitle="Review, verify identity documents, and onboard boutique owners."
          icon={ShieldCheck}
          breadcrumb={[{ label: "Owner Applications" }]}
          actions={
            <Link
              href="/admin"
              className="inline-flex items-center text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
            >
              ← Back to Overview
            </Link>
          }
        />

        {/* Client Application Review Table & Actions */}
        <ApplicationReviewClient
          initialApplications={(applications as OwnerApplication[]) || []}
        />
      </div>
    </div>
  );
}
