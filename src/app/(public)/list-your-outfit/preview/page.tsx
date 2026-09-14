import type { Metadata } from "next";
import { WizardShell } from "@/components/listing/WizardShell";
import { ListingPreview } from "@/components/listing/ListingPreview";

export const metadata: Metadata = {
  title: "Step 6: Preview & Submit — List Your Outfit | ShaadiRent",
  description: "Review your listing before submitting it for verification.",
};

export default function PreviewPage() {
  return (
    <WizardShell
      currentStep={6}
      title="Preview & Submit"
      subtitle="This is exactly how your listing will look to customers. Review all details and submit when ready."
    >
      <ListingPreview />
    </WizardShell>
  );
}
