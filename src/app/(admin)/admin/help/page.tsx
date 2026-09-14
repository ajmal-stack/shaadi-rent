import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HelpClient } from "@/components/admin/HelpClient";

export const metadata: Metadata = {
  title: "Admin Help & SOPs — Admin Console",
  description: "Standard Operating Procedures, dispute arbitration guidelines, and emergency protocols.",
};

export default function AdminHelpPage() {
  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Admin Documentation & SOPs"
          subtitle="Standard operational guides for KYC verification, dispute settlements, garment inspection grading, and escrow policies."
          icon={HelpCircle}
          breadcrumb={[{ label: "Help & SOPs" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                SOP Guidelines Active
              </span>
              <span>·</span>
              <span>Updated September 2026</span>
            </div>
          }
        />

        <HelpClient />
      </div>
    </div>
  );
}
