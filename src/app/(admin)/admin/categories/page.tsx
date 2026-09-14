import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoriesClient } from "@/components/admin/CategoriesClient";
import type { Category } from "@/types/database";

export const metadata: Metadata = {
  title: "Category Management — Admin Console",
  description: "Create, edit, and manage outfit categories on ShaadiRent.",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const [{ data: cats, error }, { data: outfitData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("outfits").select("category_id"),
  ]);

  if (error) console.error("Failed to load categories:", error);

  // Compute outfit counts per category in JS
  const countMap = (outfitData ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.category_id] = (acc[o.category_id] ?? 0) + 1;
    return acc;
  }, {});

  const categories = (cats ?? []).map((c) => ({
    ...c,
    outfit_count: countMap[c.id] ?? 0,
  }));

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Category Management"
          subtitle="Manage the outfit categories available to renters and owners. Toggle active/inactive to show or hide from browse."
          icon={FolderOpen}
          breadcrumb={[{ label: "Categories" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{categories.length}</strong> categories
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700">{activeCount}</strong> active
              </span>
              <span>·</span>
              <span>
                <strong className="text-stone-500">{categories.length - activeCount}</strong>{" "}
                inactive
              </span>
            </div>
          }
        />

        <CategoriesClient initialCategories={categories as (Category & { outfit_count: number })[]} />
      </div>
    </div>
  );
}
