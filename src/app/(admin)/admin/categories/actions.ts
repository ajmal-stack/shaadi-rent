"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GenderType } from "@/types/database";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, userId: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { supabase: null, userId: null, error: "Admin access required" };

  return { supabase, userId: user.id, error: null };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", categoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return { success: true, error: null };
}

export async function createCategory(formData: {
  name: string;
  gender_type: GenderType;
  description?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const slug = slugify(formData.name);

  const { error } = await supabase.from("categories").insert({
    name: formData.name.trim(),
    slug,
    gender_type: formData.gender_type,
    description: formData.description?.trim() || null,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return { success: true, error: null };
}

export async function updateCategory(
  categoryId: string,
  formData: {
    name: string;
    gender_type: GenderType;
    description?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.name.trim(),
      slug: slugify(formData.name),
      gender_type: formData.gender_type,
      description: formData.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return { success: true, error: null };
}
