import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UsersClient } from "@/components/admin/UsersClient";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "User Management — Admin Console",
  description: "View and manage all registered ShaadiRent users.",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load users:", error);
  }

  const stats = {
    total: users?.length ?? 0,
    customers: users?.filter((u) => u.role === "customer").length ?? 0,
    owners: users?.filter((u) => u.role === "owner").length ?? 0,
    admins: users?.filter((u) => u.role === "admin").length ?? 0,
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="User Management"
          subtitle="View, search, and manage all registered users across the platform."
          icon={Users}
          breadcrumb={[{ label: "Users" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span><strong className="text-stone-800">{stats.total}</strong> total</span>
              <span>·</span>
              <span><strong className="text-amber-800">{stats.owners}</strong> owners</span>
              <span>·</span>
              <span><strong className="text-stone-700">{stats.customers}</strong> customers</span>
              <span>·</span>
              <span><strong className="text-rose-800">{stats.admins}</strong> admins</span>
            </div>
          }
        />

        <UsersClient initialUsers={(users as Profile[]) ?? []} />
      </div>
    </div>
  );
}
