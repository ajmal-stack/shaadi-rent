import type { Metadata } from "next";
import { WizardShell } from "@/components/listing/WizardShell";
import { AvailabilityPicker } from "@/components/listing/AvailabilityPicker";

export const metadata: Metadata = {
  title: "Step 5: Availability — List Your Outfit | ShaadiRent",
  description: "Mark when your outfit is available or unavailable for rental.",
};

export default function AvailabilityPage() {
  return (
    <WizardShell
      currentStep={5}
      title="Availability"
      subtitle="Mark dates when the outfit is available to rent, and block out dates when you need it yourself. You can always update this later."
    >
      <AvailabilityPicker />
    </WizardShell>
  );
}
