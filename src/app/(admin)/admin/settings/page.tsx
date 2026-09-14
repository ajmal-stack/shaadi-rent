import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsClient } from "@/components/admin/SettingsClient";

export const metadata: Metadata = {
  title: "Settings — Admin Console",
  description: "Platform configurations, commission rates, and security parameters.",
};

export default function AdminSettingsPage() {
  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Platform Settings"
          subtitle="Configure commission rates, escrow parameters, security policies, and notification rules."
          icon={Settings}
          breadcrumb={[{ label: "Settings" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Configuration
              </span>
              <span>·</span>
              <span>Version 2.4.0</span>
            </div>
          }
        />

        <SettingsClient />
      </div>
    </div>
  );
}
