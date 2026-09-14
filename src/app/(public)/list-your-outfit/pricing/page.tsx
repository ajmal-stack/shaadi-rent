import type { Metadata } from "next";
import { WizardShell } from "@/components/listing/WizardShell";
import { PricingForm } from "@/components/listing/PricingForm";

export const metadata: Metadata = {
  title: "Step 4: Pricing — List Your Outfit | ShaadiRent",
  description: "Set your rental price and security deposit.",
};

export default function PricingPage() {
  return (
    <WizardShell
      currentStep={4}
      title="Pricing"
      subtitle="Set a fair rental price and optional security deposit. Transparent pricing builds trust with customers."
    >
      <PricingForm />
    </WizardShell>
  );
}
