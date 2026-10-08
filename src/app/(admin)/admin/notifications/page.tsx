import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NotificationsClient } from "@/components/admin/NotificationsClient";
import { getBroadcastStatsAction } from "./actions";

export const metadata: Metadata = {
  title: "Broadcasts & Offers — Admin Console",
  description: "Send promotional announcements, festive discounts, and multi-channel notifications to users.",
};

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const result = await getBroadcastStatsAction();

  const stats = result.stats || {
    totalUsers: 0,
    promotionsOpted: 0,
    whatsappReady: 0,
    totalCampaigns: 0,
  };

  const campaigns = result.campaigns || [];

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Broadcasts &amp; Offers"
          subtitle="Dispatch festive sales, promotional discounts, and custom announcements across Free WhatsApp, Email, and In-App channels."
          icon={Megaphone}
          breadcrumb={[{ label: "Broadcasts & Offers" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                100% Free Multi-Channel Gateway
              </span>
              <span>·</span>
              <span>WhatsApp (wa.me) &amp; Resend Email &amp; In-App</span>
            </div>
          }
        />

        <NotificationsClient
          initialStats={stats}
          initialCampaigns={campaigns}
        />
      </div>
    </div>
  );
}
