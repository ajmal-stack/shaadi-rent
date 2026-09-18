import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CustomizationClient } from "@/components/admin/CustomizationClient";

export const metadata: Metadata = {
  title: "Customization — Admin Console",
  description:
    "Control which UI features, booking steps, and action buttons are visible or actionable per role (Admin, Owner, Customer).",
};

export default function AdminCustomizationPage() {
  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Customization"
          subtitle="Configure which UI controls, booking progress steps, and platform features are visible or actionable per role."
          icon={Palette}
          breadcrumb={[{ label: "Customization" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Role-based UI Permissions
              </span>
              <span>·</span>
              <span>Admin · Owner · Customer</span>
            </div>
          }
        />

        <CustomizationClient />
      </div>
    </div>
  );
}
