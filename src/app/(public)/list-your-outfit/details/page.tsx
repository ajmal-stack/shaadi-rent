import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WizardShell } from "@/components/listing/WizardShell";
import { DetailsForm } from "@/components/listing/DetailsForm";

export const metadata: Metadata = {
  title: "Step 1: Basic Details — List Your Outfit | ShaadiRent",
  description: "Tell us about your wedding outfit — category, name, condition, and location.",
};

export default async function DetailsPage() {
  const supabase = await createClient();

  // Load categories from DB — RLS allows anon read of active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, gender_type")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <WizardShell
      currentStep={1}
      title="Basic Details"
      subtitle="Tell us about your outfit — category, name, and condition. All the basics to help customers find it."
    >
      <DetailsForm categories={categories ?? []} />
    </WizardShell>
  );
}
