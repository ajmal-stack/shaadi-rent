import type { Metadata } from "next";
import { WizardShell } from "@/components/listing/WizardShell";
import { MeasurementsForm } from "@/components/listing/MeasurementsForm";

export const metadata: Metadata = {
  title: "Step 2: Measurements — List Your Outfit | ShaadiRent",
  description: "Enter garment measurements so customers can check the fit.",
};

export default function MeasurementsPage() {
  return (
    <WizardShell
      currentStep={2}
      title="Garment Measurements"
      subtitle="Accurate measurements help customers find the perfect fit. All fields are optional — skip any that don't apply."
    >
      <MeasurementsForm />
    </WizardShell>
  );
}
